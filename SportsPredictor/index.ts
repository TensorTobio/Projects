export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  record?: string;
}

export interface NBAGame {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  date: string; // ISO string
  status: 'scheduled' | 'live' | 'final' | 'postponed';
  statusText: string;
  homeScore?: number;
  awayScore?: number;
  period?: number;
  clock?: string;
  odds?: {
    homeSpread?: number;
    awaySpread?: number;
    homeMoneyline?: number;
    awayMoneyline?: number;
  };
}

export interface Prediction {
  id: string;
  userId: string;
  gameId: string;
  predictedWinner: 'home' | 'away';
  confidence: number; // 1-10
  createdAt: string;
  resolvedAt?: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  // snapshot at prediction time
  homeTeam: Team;
  awayTeam: Team;
  gameDate: string;
  gameStatus: string;
}

export interface UserStats {
  userId: string;
  totalPredictions: number;
  correctPredictions: number;
  totalPoints: number;
  currentStreak: number;
  bestStreak: number;
  avgConfidence: number;
  accuracyByConfidence: Record<number, { correct: number; total: number }>;
  recentPredictions: Prediction[];
  rank?: number;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  totalPoints: number;
  correctPredictions: number;
  totalPredictions: number;
  accuracy: number;
  currentStreak: number;
  rank: number;
}

export interface BehavioralInsight {
  type: 'overconfidence' | 'recency_bias' | 'chasing_loss' | 'underdog_edge' | 'positive';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  recommendation: string;
}

export type PropStat = 'points' | 'rebounds' | 'assists' | 'threes';

export interface PlayerProp {
  playerId: string;
  playerName: string;
  playerPhoto?: string;
  teamAbbrev: string;
  gameId: string;
  stat: PropStat;
  line: number;          // e.g. 24.5
  seasonAvg: number;     // real ESPN season average
}

export interface PropPrediction {
  id: string;
  userId: string;
  gameId: string;
  playerId: string;
  playerName: string;
  teamAbbrev: string;
  stat: PropStat;
  line: number;
  pick: 'over' | 'under';
  confidence: number;
  createdAt: string;
  resolvedAt?: string;
  actualValue?: number;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface AnalyticsData {
  accuracyOverTime: Array<{ date: string; accuracy: number; predictions: number }>;
  confidenceVsAccuracy: Array<{ confidence: number; accuracy: number; count: number }>;
  streakHistory: Array<{ date: string; streak: number }>;
  recentForm: Array<{ date: string; correct: boolean; confidence: number }>;
  insights: BehavioralInsight[];
}
