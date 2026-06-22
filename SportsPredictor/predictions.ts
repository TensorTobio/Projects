import {
  collection, doc, addDoc, updateDoc, getDocs,
  query, where, orderBy, limit, getDoc, setDoc, increment,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Prediction, UserStats, LeaderboardEntry, PropPrediction, PropStat } from '../types';

const POINTS_BASE = 10;
const POINTS_CONFIDENCE_BONUS = 2;

export async function submitPrediction(
  userId: string,
  prediction: Omit<Prediction, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  // Check for duplicate prediction
  const existing = await getDocs(
    query(
      collection(db, 'predictions'),
      where('userId', '==', userId),
      where('gameId', '==', prediction.gameId)
    )
  );
  if (!existing.empty) {
    throw new Error('You have already predicted this game.');
  }

  const docRef = await addDoc(collection(db, 'predictions'), {
    ...prediction,
    userId,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getUserPredictions(userId: string): Promise<Prediction[]> {
  const q = query(
    collection(db, 'predictions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Prediction));
}

export async function getPredictionForGame(userId: string, gameId: string): Promise<Prediction | null> {
  const q = query(
    collection(db, 'predictions'),
    where('userId', '==', userId),
    where('gameId', '==', gameId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() } as Prediction;
}

export async function resolvePrediction(
  predictionId: string,
  homeScore: number,
  awayScore: number
): Promise<void> {
  const predRef = doc(db, 'predictions', predictionId);
  const predSnap = await getDoc(predRef);
  if (!predSnap.exists()) return;

  const pred = { id: predSnap.id, ...predSnap.data() } as Prediction;
  if (pred.resolvedAt) return; // already resolved

  const actualWinner: 'home' | 'away' = homeScore > awayScore ? 'home' : 'away';
  const isCorrect = pred.predictedWinner === actualWinner;

  let pointsEarned = 0;
  if (isCorrect) {
    pointsEarned = POINTS_BASE;
    if (pred.confidence > 5) {
      pointsEarned += (pred.confidence - 5) * POINTS_CONFIDENCE_BONUS;
    }
  }

  await updateDoc(predRef, {
    resolvedAt: new Date().toISOString(),
    isCorrect,
    pointsEarned,
  });

  // Update user stats
  await updateUserStats(pred.userId, isCorrect, pred.confidence, pointsEarned);
}

async function updateUserStats(
  userId: string,
  isCorrect: boolean,
  confidence: number,
  pointsEarned: number
): Promise<void> {
  const statsRef = doc(db, 'userStats', userId);
  const statsSnap = await getDoc(statsRef);

  if (!statsSnap.exists()) {
    await setDoc(statsRef, {
      userId,
      totalPredictions: 1,
      correctPredictions: isCorrect ? 1 : 0,
      totalPoints: pointsEarned,
      currentStreak: isCorrect ? 1 : 0,
      bestStreak: isCorrect ? 1 : 0,
      avgConfidence: confidence,
      accuracyByConfidence: {
        [confidence]: { correct: isCorrect ? 1 : 0, total: 1 },
      },
    });
    return;
  }

  const stats = statsSnap.data() as UserStats;
  const newStreak = isCorrect ? (stats.currentStreak || 0) + 1 : 0;
  const newBestStreak = Math.max(stats.bestStreak || 0, newStreak);
  const newTotal = (stats.totalPredictions || 0) + 1;
  const newAvgConf = ((stats.avgConfidence || 0) * (newTotal - 1) + confidence) / newTotal;

  const confKey = String(confidence);
  const existingConf = stats.accuracyByConfidence?.[confidence] || { correct: 0, total: 0 };

  await updateDoc(statsRef, {
    totalPredictions: increment(1),
    correctPredictions: increment(isCorrect ? 1 : 0),
    totalPoints: increment(pointsEarned),
    currentStreak: newStreak,
    bestStreak: newBestStreak,
    avgConfidence: newAvgConf,
    [`accuracyByConfidence.${confKey}`]: {
      correct: existingConf.correct + (isCorrect ? 1 : 0),
      total: existingConf.total + 1,
    },
  });
}

export async function getUserStats(userId: string): Promise<UserStats | null> {
  const snap = await getDoc(doc(db, 'userStats', userId));
  if (!snap.exists()) return null;
  return snap.data() as UserStats;
}

// ─── Player Props ──────────────────────────────────────────────────────────

export async function submitPropPrediction(
  userId: string,
  prop: Omit<PropPrediction, 'id' | 'userId' | 'createdAt'>
): Promise<string> {
  const existing = await getDocs(
    query(
      collection(db, 'propPredictions'),
      where('userId', '==', userId),
      where('gameId', '==', prop.gameId),
      where('playerId', '==', prop.playerId),
      where('stat', '==', prop.stat)
    )
  );
  if (!existing.empty) throw new Error('You already predicted this prop.');

  const docRef = await addDoc(collection(db, 'propPredictions'), {
    ...prop,
    userId,
    createdAt: new Date().toISOString(),
  });
  return docRef.id;
}

export async function getUserPropPredictions(userId: string): Promise<PropPrediction[]> {
  const q = query(
    collection(db, 'propPredictions'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PropPrediction));
}

export async function getPropPredictionsForGame(
  userId: string,
  gameId: string
): Promise<PropPrediction[]> {
  const q = query(
    collection(db, 'propPredictions'),
    where('userId', '==', userId),
    where('gameId', '==', gameId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as PropPrediction));
}

export async function resolvePropPredictions(
  gameId: string,
  boxScore: Record<string, Record<PropStat, number>>
): Promise<void> {
  const q = query(
    collection(db, 'propPredictions'),
    where('gameId', '==', gameId)
  );
  const snap = await getDocs(q);

  await Promise.all(
    snap.docs.map(async (d) => {
      const pred = { id: d.id, ...d.data() } as PropPrediction;
      if (pred.resolvedAt) return;

      const playerStats = boxScore[pred.playerId];
      if (!playerStats) return;

      const actual = playerStats[pred.stat];
      const isCorrect =
        pred.pick === 'over' ? actual > pred.line : actual < pred.line;
      const pointsEarned = isCorrect ? 8 + (pred.confidence - 5) * 1 : 0;

      await updateDoc(doc(db, 'propPredictions', d.id), {
        resolvedAt: new Date().toISOString(),
        actualValue: actual,
        isCorrect,
        pointsEarned: Math.max(0, pointsEarned),
      });

      if (isCorrect) {
        await updateUserStats(pred.userId, true, pred.confidence, Math.max(0, pointsEarned));
      }
    })
  );
}

export async function getLeaderboard(count = 20): Promise<LeaderboardEntry[]> {
  const q = query(
    collection(db, 'userStats'),
    orderBy('totalPoints', 'desc'),
    limit(count)
  );
  const snap = await getDocs(q);

  const entries: LeaderboardEntry[] = await Promise.all(
    snap.docs.map(async (d, i) => {
      const stats = d.data() as UserStats;
      // Fetch user display info
      const userSnap = await getDoc(doc(db, 'users', d.id));
      const userData = userSnap.exists() ? userSnap.data() : {};

      return {
        userId: d.id,
        displayName: userData.displayName || 'Anonymous',
        photoURL: userData.photoURL,
        totalPoints: stats.totalPoints || 0,
        correctPredictions: stats.correctPredictions || 0,
        totalPredictions: stats.totalPredictions || 0,
        accuracy:
          stats.totalPredictions > 0
            ? Math.round((stats.correctPredictions / stats.totalPredictions) * 100)
            : 0,
        currentStreak: stats.currentStreak || 0,
        rank: i + 1,
      };
    })
  );

  return entries;
}
