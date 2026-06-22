import { useEffect, useState } from 'react';
import type { PlayerProp, PropPrediction, PropStat } from '../../types';
import { fetchPropsForGame } from '../../services/nba';
import { submitPropPrediction, getPropPredictionsForGame } from '../../services/predictions';
import { useAuth } from '../../contexts/AuthContext';
import { ChevronUp, ChevronDown, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';

const STAT_LABELS: Record<PropStat, string> = {
  points: 'Points',
  rebounds: 'Rebounds',
  assists: 'Assists',
  threes: '3-Pointers',
};

const STAT_COLORS: Record<PropStat, string> = {
  points: 'text-orange-400',
  rebounds: 'text-blue-400',
  assists: 'text-green-400',
  threes: 'text-purple-400',
};

interface PropCardProps {
  prop: PlayerProp;
  existing?: PropPrediction;
  onPicked: (pick: 'over' | 'under', confidence: number) => Promise<void>;
}

function PropCard({ prop, existing, onPicked }: PropCardProps) {
  const [pick, setPick] = useState<'over' | 'under' | null>(null);
  const [confidence, setConfidence] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!pick) return;
    setLoading(true);
    setError('');
    try {
      await onPicked(pick, confidence);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (existing) {
    const resolved = existing.resolvedAt !== undefined;
    return (
      <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          {prop.playerPhoto && (
            <img src={prop.playerPhoto} alt={prop.playerName} className="w-8 h-8 rounded-full object-cover bg-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate">{prop.playerName}</div>
            <div className="text-xs text-gray-500">{prop.teamAbbrev}</div>
          </div>
        </div>
        <div className={`text-xs font-medium mb-2 ${STAT_COLORS[prop.stat]}`}>
          {STAT_LABELS[prop.stat]} · Line {prop.line}
        </div>
        <div className={`flex items-center gap-2 text-xs px-2 py-1.5 rounded-lg ${
          !resolved ? 'bg-orange-500/10 text-orange-400' :
          existing.isCorrect ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
        }`}>
          {!resolved
            ? <Clock className="w-3 h-3" />
            : existing.isCorrect ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
          <span className="font-medium">
            {existing.pick.toUpperCase()} {existing.line}
          </span>
          {resolved && (
            <span className="ml-auto text-gray-400">
              Actual: {existing.actualValue} · {existing.isCorrect ? `+${existing.pointsEarned}pts` : '0pts'}
            </span>
          )}
          {!resolved && <span className="ml-auto text-gray-500">Conf {existing.confidence}/10</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/60 rounded-xl p-3 border border-gray-700">
      {/* Player */}
      <div className="flex items-center gap-2 mb-2">
        {prop.playerPhoto && (
          <img src={prop.playerPhoto} alt={prop.playerName} className="w-8 h-8 rounded-full object-cover bg-gray-700" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-white truncate">{prop.playerName}</div>
          <div className="text-xs text-gray-500">{prop.teamAbbrev}</div>
        </div>
        <div className="text-right">
          <div className={`text-xs font-bold ${STAT_COLORS[prop.stat]}`}>{STAT_LABELS[prop.stat]}</div>
          <div className="text-xs text-gray-500">Avg {prop.seasonAvg.toFixed(1)}</div>
        </div>
      </div>

      {/* Line + buttons */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setPick('over')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-colors ${
            pick === 'over'
              ? 'bg-green-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          <ChevronUp className="w-4 h-4" />
          Over {prop.line}
        </button>
        <button
          onClick={() => setPick('under')}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-bold transition-colors ${
            pick === 'under'
              ? 'bg-red-500 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          <ChevronDown className="w-4 h-4" />
          Under {prop.line}
        </button>
      </div>

      {/* Confidence + submit */}
      {pick && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Confidence</span>
            <span className="font-bold text-orange-400">{confidence}/10</span>
          </div>
          <input
            type="range" min={1} max={10} value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="w-full accent-orange-500 cursor-pointer"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : `Lock in ${pick.toUpperCase()} ${prop.line}`}
          </button>
        </div>
      )}
    </div>
  );
}

interface Props {
  gameId: string;
  gameStatus: string;
}

export default function PlayerPropsSection({ gameId, gameStatus }: Props) {
  const { user } = useAuth();
  const [props, setProps] = useState<PlayerProp[]>([]);
  const [predictions, setPredictions] = useState<PropPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!expanded) return;
    setLoading(true);
    Promise.all([
      fetchPropsForGame(gameId),
      user ? getPropPredictionsForGame(user.uid, gameId) : Promise.resolve([]),
    ]).then(([p, preds]) => {
      setProps(p);
      setPredictions(preds);
      setLoading(false);
    });
  }, [gameId, user, expanded]);

  async function handlePick(prop: PlayerProp, pick: 'over' | 'under', confidence: number) {
    if (!user) return;
    await submitPropPrediction(user.uid, {
      gameId: prop.gameId,
      playerId: prop.playerId,
      playerName: prop.playerName,
      teamAbbrev: prop.teamAbbrev,
      stat: prop.stat,
      line: prop.line,
      pick,
      confidence,
    });
    const updated = await getPropPredictionsForGame(user.uid, gameId);
    setPredictions(updated);
  }

  // Group props by player
  const byPlayer: Record<string, PlayerProp[]> = {};
  props.forEach((p) => {
    if (!byPlayer[p.playerId]) byPlayer[p.playerId] = [];
    byPlayer[p.playerId].push(p);
  });

  const isPredictable = gameStatus === 'scheduled';

  return (
    <div className="mt-2 border-t border-gray-800 pt-2">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-1 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
          <span className="font-medium">Player Props</span>
          {predictions.length > 0 && (
            <span className="bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded text-xs">
              {predictions.length} picked
            </span>
          )}
        </div>
        <span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="mt-2">
          {loading ? (
            <div className="text-center py-4">
              <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500 mt-2">Loading player stats from ESPN...</p>
            </div>
          ) : props.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">
              No prop data available for this game yet.
            </p>
          ) : (
            <div className="space-y-2">
              {Object.values(byPlayer).map((playerProps) =>
                playerProps.map((prop) => {
                  const existing = predictions.find(
                    (p) => p.playerId === prop.playerId && p.stat === prop.stat
                  );
                  return (
                    <PropCard
                      key={`${prop.playerId}-${prop.stat}`}
                      prop={prop}
                      existing={existing}
                      onPicked={(pick, conf) =>
                        isPredictable
                          ? handlePick(prop, pick, conf)
                          : Promise.reject(new Error('Game already started'))
                      }
                    />
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
