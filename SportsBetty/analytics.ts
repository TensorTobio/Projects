import type { Prediction, BehavioralInsight, AnalyticsData } from '../types';
import { format, parseISO } from 'date-fns';

export function computeAnalytics(predictions: Prediction[]): AnalyticsData {
  const resolved = predictions.filter(p => p.resolvedAt !== undefined);

  return {
    accuracyOverTime: computeAccuracyOverTime(resolved),
    confidenceVsAccuracy: computeConfidenceVsAccuracy(resolved),
    streakHistory: computeStreakHistory(resolved),
    recentForm: computeRecentForm(resolved),
    insights: generateInsights(resolved),
  };
}

function computeAccuracyOverTime(
  predictions: Prediction[]
): AnalyticsData['accuracyOverTime'] {
  const byDate: Record<string, { correct: number; total: number }> = {};

  predictions.forEach(p => {
    const date = format(parseISO(p.createdAt), 'MMM d');
    if (!byDate[date]) byDate[date] = { correct: 0, total: 0 };
    byDate[date].total++;
    if (p.isCorrect) byDate[date].correct++;
  });

  return Object.entries(byDate)
    .slice(-14) // last 14 days
    .map(([date, { correct, total }]) => ({
      date,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      predictions: total,
    }));
}

function computeConfidenceVsAccuracy(
  predictions: Prediction[]
): AnalyticsData['confidenceVsAccuracy'] {
  const byConf: Record<number, { correct: number; total: number }> = {};

  predictions.forEach(p => {
    if (!byConf[p.confidence]) byConf[p.confidence] = { correct: 0, total: 0 };
    byConf[p.confidence].total++;
    if (p.isCorrect) byConf[p.confidence].correct++;
  });

  return Array.from({ length: 10 }, (_, i) => i + 1).map(conf => {
    const data = byConf[conf] || { correct: 0, total: 0 };
    return {
      confidence: conf,
      accuracy: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
      count: data.total,
    };
  });
}

function computeStreakHistory(predictions: Prediction[]): AnalyticsData['streakHistory'] {
  let streak = 0;
  return predictions
    .slice()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map(p => {
      if (p.isCorrect) streak++;
      else streak = 0;
      return { date: format(parseISO(p.createdAt), 'MMM d'), streak };
    })
    .slice(-20);
}

function computeRecentForm(predictions: Prediction[]): AnalyticsData['recentForm'] {
  return predictions
    .slice(0, 10)
    .map(p => ({
      date: format(parseISO(p.createdAt), 'MMM d'),
      correct: p.isCorrect ?? false,
      confidence: p.confidence,
    }));
}

export function generateInsights(predictions: Prediction[]): BehavioralInsight[] {
  if (predictions.length < 5) return [];

  const insights: BehavioralInsight[] = [];

  // 1. Overconfidence detection
  const highConfPreds = predictions.filter(p => p.confidence >= 8);
  if (highConfPreds.length >= 3) {
    const highConfAccuracy =
      highConfPreds.filter(p => p.isCorrect).length / highConfPreds.length;
    if (highConfAccuracy < 0.55) {
      insights.push({
        type: 'overconfidence',
        severity: highConfAccuracy < 0.4 ? 'high' : 'medium',
        title: 'Overconfidence Detected',
        description: `When you rate confidence 8-10, your actual accuracy is only ${Math.round(highConfAccuracy * 100)}%. High confidence does not match your outcomes.`,
        recommendation: 'Try rating 6-7 for uncertain games. Reserve 9-10 for only the most obvious matchups.',
      });
    }
  }

  // Overall confidence vs accuracy check
  const overallAccuracy =
    predictions.filter(p => p.isCorrect).length / predictions.length;
  const avgConf =
    predictions.reduce((s, p) => s + p.confidence, 0) / predictions.length;
  if (avgConf > 7 && overallAccuracy < 0.55) {
    insights.push({
      type: 'overconfidence',
      severity: 'medium',
      title: 'Confidence Consistently Higher Than Accuracy',
      description: `Your average confidence is ${avgConf.toFixed(1)}/10 but your accuracy is ${Math.round(overallAccuracy * 100)}%. You may be overestimating how certain your predictions are.`,
      recommendation: 'Try calibrating by lowering confidence scores by 1-2 points and observe if your outcomes align better.',
    });
  }

  // 2. Recency bias — confidence increased after recent wins
  const last10 = predictions.slice(0, 10);
  const last10Wins = last10.filter(p => p.isCorrect).length;
  if (last10Wins >= 7) {
    const last10AvgConf = last10.reduce((s, p) => s + p.confidence, 0) / last10.length;
    const overallAvgConf = avgConf;
    if (last10AvgConf > overallAvgConf + 1) {
      insights.push({
        type: 'recency_bias',
        severity: 'low',
        title: 'Recency Bias — Win Streak Inflating Confidence',
        description: `After your recent ${last10Wins}/10 run, your confidence has risen to ${last10AvgConf.toFixed(1)} vs your overall average of ${overallAvgConf.toFixed(1)}.`,
        recommendation: 'Hot streaks are great, but maintain consistent confidence levels. Past wins don\'t guarantee future success.',
      });
    }
  }

  // 3. Chasing loss — confidence increases after losses
  const sorted = predictions.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let chasingCount = 0;
  for (let i = 1; i < sorted.length; i++) {
    if (!sorted[i - 1].isCorrect && sorted[i].confidence > sorted[i - 1].confidence) {
      chasingCount++;
    }
  }
  const chasingRate = chasingCount / (sorted.length - 1);
  if (chasingRate > 0.5 && sorted.length >= 8) {
    insights.push({
      type: 'chasing_loss',
      severity: chasingRate > 0.65 ? 'high' : 'medium',
      title: 'Loss-Chasing Behavior Detected',
      description: `After ${Math.round(chasingRate * 100)}% of your incorrect predictions, you increase confidence on the next game — a sign of trying to "make up" for losses.`,
      recommendation: 'Each game is independent. Making high-confidence predictions after a loss often leads to further mistakes.',
    });
  }

  // 4. Underdog edge
  const underdogPreds = predictions.filter(p => {
    // Rough proxy: away team predictions (underdogs more often away)
    return p.predictedWinner === 'away';
  });
  if (underdogPreds.length >= 5) {
    const underdogAcc =
      underdogPreds.filter(p => p.isCorrect).length / underdogPreds.length;
    const favoritePreds = predictions.filter(p => p.predictedWinner === 'home');
    const favoriteAcc =
      favoritePreds.length > 0
        ? favoritePreds.filter(p => p.isCorrect).length / favoritePreds.length
        : 0;
    if (underdogAcc > favoriteAcc + 0.1) {
      insights.push({
        type: 'underdog_edge',
        severity: 'low',
        title: 'Strong Underdog Prediction Performance',
        description: `You predict away/underdog teams correctly ${Math.round(underdogAcc * 100)}% of the time vs ${Math.round(favoriteAcc * 100)}% for favorites. You have a natural feel for upsets.`,
        recommendation: 'Lean into your underdog analysis — this is a genuine edge. Consider tracking your reasoning when you pick underdogs.',
      });
    }
  }

  // 5. Positive streak reinforcement
  if (overallAccuracy > 0.65 && predictions.length >= 10) {
    insights.push({
      type: 'positive',
      severity: 'low',
      title: 'Above-Average Prediction Accuracy',
      description: `With ${Math.round(overallAccuracy * 100)}% accuracy over ${predictions.length} games, you're performing well above the average predictor.`,
      recommendation: 'Keep tracking your reasoning for each pick — you\'re building real skill. Try documenting why you made each prediction.',
    });
  }

  return insights;
}
