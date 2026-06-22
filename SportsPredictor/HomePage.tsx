import { useEffect, useState, useCallback } from 'react';
import { fetchTodayAndUpcoming } from '../services/nba';
import { getPredictionForGame, resolvePrediction, resolvePropPredictions } from '../services/predictions';
import { fetchBoxScoreStats } from '../services/nba';
import type { NBAGame, Prediction } from '../types';
import { useAuth } from '../contexts/AuthContext';
import GameCard from '../components/games/GameCard';
import { RefreshCw, AlertTriangle, CalendarDays, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function HomePage() {
  const { user } = useAuth();
  const [todayGames, setTodayGames] = useState<NBAGame[]>([]);
  const [upcomingGames, setUpcomingGames] = useState<NBAGame[]>([]);
  const [predictions, setPredictions] = useState<Record<string, Prediction | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const loadGames = useCallback(async () => {
    setError('');
    try {
      const { today, upcoming } = await fetchTodayAndUpcoming();
      setTodayGames(today);
      setUpcomingGames(upcoming);
      setLastRefresh(new Date());

      // Auto-resolve any finished games
      if (user) {
        const allGames = [...today, ...upcoming];
        const predMap: Record<string, Prediction | null> = {};
        await Promise.all(
          allGames.map(async (game) => {
            const pred = await getPredictionForGame(user.uid, game.id);
            predMap[game.id] = pred;
            // Resolve if game is final and prediction is unresolved
            if (
              game.status === 'final' &&
              pred &&
              pred.resolvedAt === undefined &&
              game.homeScore !== undefined &&
              game.awayScore !== undefined
            ) {
              await resolvePrediction(pred.id, game.homeScore, game.awayScore);
              predMap[game.id] = { ...pred, resolvedAt: new Date().toISOString() };
              // Also resolve any prop predictions for this game
              const boxScore = await fetchBoxScoreStats(game.id);
              if (Object.keys(boxScore).length > 0) {
                await resolvePropPredictions(game.id, boxScore);
              }
            }
          })
        );
        setPredictions(predMap);
      }
    } catch (e: any) {
      setError(
        'Unable to load NBA games from ESPN. Please check your connection and try again. No fabricated games are shown.'
      );
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    loadGames().finally(() => setLoading(false));
  }, [loadGames]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      loadGames();
    }, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadGames]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadGames();
    setRefreshing(false);
  }

  function handlePredictionMade() {
    loadGames();
  }

  // Group upcoming by date
  const upcomingByDate: Record<string, NBAGame[]> = {};
  upcomingGames.forEach((g) => {
    const dateKey = format(parseISO(g.date), 'EEE, MMM d');
    if (!upcomingByDate[dateKey]) upcomingByDate[dateKey] = [];
    upcomingByDate[dateKey].push(g);
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-16">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading NBA games from ESPN...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">NBA Games</h1>
          {lastRefresh && (
            <p className="text-xs text-gray-500 mt-0.5">
              Updated {format(lastRefresh, 'h:mm a')} · Auto-refreshes every 2 min
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-800 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium text-sm">Data Source Error</p>
            <p className="text-red-300/70 text-sm mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Today's games */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-orange-400" />
          <h2 className="font-semibold text-white">Today · {format(new Date(), 'EEEE, MMMM d')}</h2>
          {todayGames.length > 0 && (
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
              {todayGames.length} game{todayGames.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {!error && todayGames.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <CalendarDays className="w-8 h-8 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No games scheduled today</p>
            <p className="text-gray-600 text-sm mt-1">Check upcoming games below</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {todayGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                prediction={predictions[game.id]}
                onPredictionMade={handlePredictionMade}
              />
            ))}
          </div>
        )}
      </section>

      {/* Upcoming games */}
      {!error && Object.keys(upcomingByDate).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-4 h-4 text-gray-400" />
            <h2 className="font-semibold text-white">Upcoming</h2>
          </div>
          <div className="space-y-6">
            {Object.entries(upcomingByDate).map(([date, games]) => (
              <div key={date}>
                <p className="text-sm font-medium text-gray-400 mb-3">{date}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {games.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      prediction={predictions[game.id]}
                      onPredictionMade={handlePredictionMade}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
