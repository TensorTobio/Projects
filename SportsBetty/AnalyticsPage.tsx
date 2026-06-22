import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPredictions } from '../services/predictions';
import { computeAnalytics } from '../services/analytics';
import type { Prediction, AnalyticsData, BehavioralInsight } from '../types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, ReferenceLine,
} from 'recharts';
import { Brain, AlertTriangle, TrendingUp, Star, ChevronRight } from 'lucide-react';

const INSIGHT_ICONS: Record<BehavioralInsight['type'], React.ReactNode> = {
  overconfidence: <AlertTriangle className="w-4 h-4 text-red-400" />,
  recency_bias: <TrendingUp className="w-4 h-4 text-yellow-400" />,
  chasing_loss: <AlertTriangle className="w-4 h-4 text-orange-400" />,
  underdog_edge: <Star className="w-4 h-4 text-green-400" />,
  positive: <Star className="w-4 h-4 text-blue-400" />,
};

const SEVERITY_COLORS: Record<BehavioralInsight['severity'], string> = {
  low: 'border-blue-800 bg-blue-900/10',
  medium: 'border-yellow-800 bg-yellow-900/10',
  high: 'border-red-800 bg-red-900/10',
};

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getUserPredictions(user.uid).then((preds) => {
      setPredictions(preds);
      setAnalytics(computeAnalytics(preds));
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Analyzing your predictions...</p>
      </div>
    );
  }

  const resolved = predictions.filter((p) => p.resolvedAt);

  if (resolved.length < 5) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-white mb-6">Behavioral Analytics</h1>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <Brain className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-white font-semibold">Not enough data yet</p>
          <p className="text-gray-500 text-sm mt-2">
            Make at least 5 predictions on completed games to unlock behavioral insights.
          </p>
          <p className="text-gray-600 text-xs mt-1">
            You have {resolved.length} resolved prediction{resolved.length !== 1 ? 's' : ''} so far.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Behavioral Analytics</h1>
        <p className="text-gray-500 text-sm mt-1">
          AI-powered insights based on your {resolved.length} resolved predictions
        </p>
      </div>

      {/* AI Insights */}
      {analytics!.insights.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4 text-purple-400" />
            <h2 className="font-semibold text-white">AI Insights</h2>
          </div>
          <div className="space-y-3">
            {analytics!.insights.map((insight, i) => (
              <div
                key={i}
                className={`border rounded-xl p-4 ${SEVERITY_COLORS[insight.severity]}`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{INSIGHT_ICONS[insight.type]}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm">{insight.title}</h3>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        insight.severity === 'high' ? 'bg-red-900/40 text-red-400' :
                        insight.severity === 'medium' ? 'bg-yellow-900/40 text-yellow-400' :
                        'bg-blue-900/40 text-blue-400'
                      }`}>
                        {insight.severity}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm mb-2">{insight.description}</p>
                    <div className="flex items-start gap-1.5">
                      <ChevronRight className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-400 text-xs italic">{insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Confidence vs Accuracy chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-1">Confidence vs. Actual Accuracy</h3>
        <p className="text-xs text-gray-500 mb-4">
          The orange line shows your actual accuracy at each confidence level. The dashed line shows perfect calibration.
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={analytics!.confidenceVsAccuracy}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="confidence" tick={{ fill: '#6b7280', fontSize: 11 }} label={{ value: 'Confidence', position: 'insideBottom', offset: -2, fill: '#6b7280', fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
              formatter={(v, name) => [name === 'accuracy' ? `${v}%` : v, name === 'accuracy' ? 'Accuracy' : 'Predictions']}
              labelFormatter={(l) => `Confidence: ${l}/10`}
            />
            <Bar dataKey="count" fill="#1f2937" name="Predictions" radius={[4, 4, 0, 0]} />
            <Bar dataKey="accuracy" fill="#f97316" name="Accuracy" radius={[4, 4, 0, 0]} opacity={0.9} />
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-600 text-center mt-2">
          Gray bars = number of predictions · Orange bars = accuracy % at that confidence
        </p>
      </div>

      {/* Recent form */}
      {analytics!.recentForm.length > 3 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Recent Form (Last 10)</h3>
          <div className="flex items-end gap-2">
            {analytics!.recentForm.map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                <div
                  className={`w-full rounded-t ${item.correct ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ height: `${item.confidence * 8}px`, minHeight: 8 }}
                />
                <div className="text-xs text-gray-600 truncate w-full text-center">{item.date}</div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3">Bar height = confidence level · Green = correct · Red = incorrect</p>
        </div>
      )}

      {/* Streak history */}
      {analytics!.streakHistory.length > 3 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Streak History</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={analytics!.streakHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
                formatter={(v) => [v, 'Streak']}
              />
              <ReferenceLine y={0} stroke="#374151" />
              <Line type="monotone" dataKey="streak" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Responsible prediction reminder */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
        <Brain className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-white">About These Insights</p>
          <p className="text-xs text-gray-500 mt-1">
            These behavioral patterns are meant to help you become a better analyst — not to criticize.
            Understanding cognitive biases like overconfidence and loss-chasing helps in many areas beyond sports prediction.
            This platform involves no real money and is for skill-building only.
          </p>
        </div>
      </div>
    </div>
  );
}
