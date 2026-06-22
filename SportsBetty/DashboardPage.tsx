import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUserPredictions, getUserStats, getUserPropPredictions } from '../services/predictions';
import type { Prediction, UserStats, PropPrediction } from '../types';
import { format, parseISO } from 'date-fns';
import { Trophy, Target, TrendingUp, Zap, CheckCircle, XCircle, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { computeAnalytics } from '../services/analytics';

export default function DashboardPage() {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [propPredictions, setPropPredictions] = useState<PropPrediction[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      getUserPredictions(user.uid),
      getUserStats(user.uid),
      getUserPropPredictions(user.uid),
    ]).then(([preds, s, props]) => {
      setPredictions(preds);
      setStats(s);
      setPropPredictions(props);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading dashboard...</p>
      </div>
    );
  }

  const analytics = computeAnalytics(predictions);
  const accuracy =
    stats && stats.totalPredictions > 0
      ? Math.round((stats.correctPredictions / stats.totalPredictions) * 100)
      : 0;

  const statCards = [
    {
      label: 'Total Points',
      value: stats?.totalPoints ?? 0,
      icon: Trophy,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Accuracy',
      value: `${accuracy}%`,
      icon: Target,
      color: 'text-green-400',
      bg: 'bg-green-400/10',
    },
    {
      label: 'Current Streak',
      value: stats?.currentStreak ?? 0,
      icon: Zap,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Predictions',
      value: stats?.totalPredictions ?? 0,
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Accuracy trend chart */}
      {analytics.accuracyOverTime.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Accuracy Over Time</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={analytics.accuracyOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#6b7280', fontSize: 11 }} unit="%" />
              <Tooltip
                contentStyle={{ background: '#111827', border: '1px solid #1f2937', borderRadius: 8 }}
                labelStyle={{ color: '#f9fafb' }}
                itemStyle={{ color: '#f97316' }}
                formatter={(v) => [`${v}%`, 'Accuracy']}
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent predictions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="font-semibold text-white mb-4">Recent Predictions</h3>
        {predictions.length === 0 ? (
          <p className="text-gray-500 text-sm">No predictions yet. Head to Games to get started!</p>
        ) : (
          <div className="space-y-2">
            {predictions.slice(0, 15).map((p) => {
              const predictedTeam =
                p.predictedWinner === 'home' ? p.homeTeam : p.awayTeam;
              const opposingTeam =
                p.predictedWinner === 'home' ? p.awayTeam : p.homeTeam;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg"
                >
                  {p.resolvedAt ? (
                    p.isCorrect ? (
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    )
                  ) : (
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">
                      <span className="text-orange-400">{predictedTeam.abbreviation}</span>
                      <span className="text-gray-500"> vs {opposingTeam.abbreviation}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(parseISO(p.createdAt), 'MMM d, yyyy')} · Confidence {p.confidence}/10
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {p.resolvedAt ? (
                      <span className={`text-sm font-bold ${p.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {p.isCorrect ? `+${p.pointsEarned}` : '0'} pts
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Prop predictions history */}
      {propPredictions.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="font-semibold text-white mb-4">Player Prop Picks</h3>
          <div className="space-y-2">
            {propPredictions.slice(0, 10).map((p) => {
              const resolved = p.resolvedAt !== undefined;
              return (
                <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                  {resolved ? (
                    p.isCorrect
                      ? <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      : <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white font-medium">
                      <span className="text-orange-400">{p.playerName}</span>
                      <span className="text-gray-400"> · {p.stat.charAt(0).toUpperCase() + p.stat.slice(1)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      {p.pick === 'over'
                        ? <ChevronUp className="w-3 h-3 text-green-400" />
                        : <ChevronDown className="w-3 h-3 text-red-400" />}
                      <span className={p.pick === 'over' ? 'text-green-400' : 'text-red-400'}>
                        {p.pick.toUpperCase()}
                      </span>
                      <span>{p.line}</span>
                      {resolved && p.actualValue !== undefined && (
                        <span className="text-gray-600 ml-1">· Actual: {p.actualValue}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {resolved ? (
                      <span className={`text-sm font-bold ${p.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                        {p.isCorrect ? `+${p.pointsEarned}` : '0'} pts
                      </span>
                    ) : (
                      <span className="text-xs text-gray-600">Pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Best streak */}
      {stats && stats.bestStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/20 rounded-xl p-4 flex items-center gap-4">
          <div className="text-3xl font-black text-orange-400">{stats.bestStreak}</div>
          <div>
            <div className="text-white font-semibold">Best Winning Streak</div>
            <div className="text-gray-400 text-sm">Current streak: {stats.currentStreak}</div>
          </div>
        </div>
      )}
    </div>
  );
}
