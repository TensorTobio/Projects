import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getLeaderboard } from '../services/predictions';
import type { LeaderboardEntry } from '../types';
import { Trophy, Medal } from 'lucide-react';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
  return <span className="text-sm font-bold text-gray-500 w-5 text-center">#{rank}</span>;
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getLeaderboard(50)
      .then(setEntries)
      .catch(() => setError('Failed to load leaderboard.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading leaderboard...</p>
      </div>
    );
  }

  const myEntry = entries.find((e) => e.userId === user?.uid);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-1">Top predictors by total points</p>
      </div>

      {/* My position card */}
      {myEntry && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
          <p className="text-xs text-orange-400 font-medium mb-2">Your Position</p>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-black text-orange-400">#{myEntry.rank}</div>
            <div className="grid grid-cols-3 gap-4 flex-1">
              <div>
                <div className="text-white font-bold">{myEntry.totalPoints}</div>
                <div className="text-xs text-gray-500">Points</div>
              </div>
              <div>
                <div className="text-white font-bold">{myEntry.accuracy}%</div>
                <div className="text-xs text-gray-500">Accuracy</div>
              </div>
              <div>
                <div className="text-white font-bold">{myEntry.currentStreak}</div>
                <div className="text-xs text-gray-500">Streak</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Top 3 podium */}
      {entries.length >= 3 && (
        <div className="grid grid-cols-3 gap-3">
          {[entries[1], entries[0], entries[2]].map((entry, i) => {
            const heights = ['h-24', 'h-32', 'h-20'];
            const colors = ['bg-gray-400/10 border-gray-600', 'bg-yellow-400/10 border-yellow-600', 'bg-amber-700/10 border-amber-700'];
            return (
              <div key={entry.userId} className={`${colors[i]} border rounded-xl p-3 flex flex-col items-center justify-end ${heights[i]}`}>
                {entry.photoURL ? (
                  <img src={entry.photoURL} alt="" className="w-8 h-8 rounded-full mb-2" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white mb-2">
                    {entry.displayName[0]}
                  </div>
                )}
                <div className="text-white text-xs font-bold text-center truncate w-full">{entry.displayName}</div>
                <div className="text-gray-400 text-xs">{entry.totalPoints} pts</div>
                <RankBadge rank={entry.rank} />
              </div>
            );
          })}
        </div>
      )}

      {/* Full table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-800/50 text-xs text-gray-500 font-medium">
          <div className="col-span-1">#</div>
          <div className="col-span-4">Player</div>
          <div className="col-span-2 text-right">Points</div>
          <div className="col-span-2 text-right hidden sm:block">Accuracy</div>
          <div className="col-span-2 text-right hidden sm:block">W/L</div>
          <div className="col-span-1 text-right">🔥</div>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">No players yet. Make predictions to appear here!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-800">
            {entries.map((entry) => {
              const isMe = entry.userId === user?.uid;
              return (
                <div
                  key={entry.userId}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 items-center ${
                    isMe ? 'bg-orange-500/5' : 'hover:bg-gray-800/30'
                  }`}
                >
                  <div className="col-span-1">
                    <RankBadge rank={entry.rank} />
                  </div>
                  <div className="col-span-4 flex items-center gap-2 min-w-0">
                    {entry.photoURL ? (
                      <img src={entry.photoURL} alt="" className="w-7 h-7 rounded-full flex-shrink-0" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                        {entry.displayName[0]}
                      </div>
                    )}
                    <span className={`text-sm font-medium truncate ${isMe ? 'text-orange-400' : 'text-white'}`}>
                      {entry.displayName}
                      {isMe && <span className="text-xs text-orange-500 ml-1">(you)</span>}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-white font-bold text-sm">{entry.totalPoints}</span>
                  </div>
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className={`text-sm font-medium ${
                      entry.accuracy >= 60 ? 'text-green-400' :
                      entry.accuracy >= 45 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {entry.accuracy}%
                    </span>
                  </div>
                  <div className="col-span-2 text-right hidden sm:block">
                    <span className="text-xs text-gray-500">
                      {entry.correctPredictions}W / {entry.totalPredictions - entry.correctPredictions}L
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    {entry.currentStreak > 0 && (
                      <span className="text-xs text-orange-400 font-bold">{entry.currentStreak}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
