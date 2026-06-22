import { useState } from 'react';
import type { NBAGame, Prediction } from '../../types';
import { format, parseISO } from 'date-fns';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import PredictModal from './PredictModal';
import PlayerPropsSection from './PlayerPropsSection';

interface Props {
  game: NBAGame;
  prediction?: Prediction | null;
  onPredictionMade?: () => void;
}

export default function GameCard({ game, prediction, onPredictionMade }: Props) {
  const [showModal, setShowModal] = useState(false);

  const isPredictable = game.status === 'scheduled';
  const isLive = game.status === 'live';
  const isFinal = game.status === 'final';

  function statusBadge() {
    if (isLive) {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-red-400 bg-red-900/30 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
          LIVE {game.period ? `Q${game.period}` : ''} {game.clock || ''}
        </span>
      );
    }
    if (isFinal) {
      return <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-0.5 rounded-full">FINAL</span>;
    }
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-gray-400">
        <Clock className="w-3 h-3" />
        {format(parseISO(game.date), 'h:mm a')}
      </span>
    );
  }

  function predictionBadge() {
    if (!prediction) return null;
    const predictedTeam =
      prediction.predictedWinner === 'home' ? game.homeTeam : game.awayTeam;
    if (prediction.isCorrect === undefined) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-orange-400 bg-orange-500/10 px-2 py-1 rounded-lg">
          <Zap className="w-3 h-3" />
          <span>Predicted: <strong>{predictedTeam.abbreviation}</strong></span>
          <span className="text-orange-300">({prediction.confidence}/10)</span>
        </div>
      );
    }
    return (
      <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
        prediction.isCorrect
          ? 'text-green-400 bg-green-900/20'
          : 'text-red-400 bg-red-900/20'
      }`}>
        {prediction.isCorrect
          ? <CheckCircle className="w-3 h-3" />
          : <XCircle className="w-3 h-3" />}
        <span>{prediction.isCorrect ? '+' : ''}{prediction.pointsEarned ?? 0} pts</span>
        <span className="text-gray-400">· {predictedTeam.abbreviation} ({prediction.confidence}/10)</span>
      </div>
    );
  }

  const homeWon = isFinal && (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWon = isFinal && (game.awayScore ?? 0) > (game.homeScore ?? 0);

  return (
    <>
      <div
        className={`bg-gray-900 border rounded-xl p-4 transition-colors ${
          isPredictable && !prediction
            ? 'border-gray-700 hover:border-orange-500/50 cursor-pointer'
            : 'border-gray-800'
        }`}
        onClick={() => isPredictable && !prediction && setShowModal(true)}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          {statusBadge()}
          {prediction && predictionBadge()}
          {!prediction && isPredictable && (
            <span className="text-xs text-orange-400 font-medium">Tap to predict →</span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center gap-3">
          {/* Away */}
          <div className={`flex-1 flex items-center gap-2 ${awayWon ? 'opacity-100' : homeWon ? 'opacity-50' : ''}`}>
            <img
              src={game.awayTeam.logo}
              alt={game.awayTeam.abbreviation}
              className="w-10 h-10 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="min-w-0">
              <div className={`font-bold text-sm ${awayWon ? 'text-white' : 'text-gray-300'}`}>
                {game.awayTeam.abbreviation}
              </div>
              <div className="text-xs text-gray-500 truncate">{game.awayTeam.record}</div>
            </div>
          </div>

          {/* Score or VS */}
          <div className="text-center flex-shrink-0 min-w-[60px]">
            {(isLive || isFinal) && game.homeScore !== undefined ? (
              <div className="flex items-center gap-2 font-bold text-xl">
                <span className={awayWon ? 'text-white' : 'text-gray-400'}>{game.awayScore}</span>
                <span className="text-gray-600 text-sm">-</span>
                <span className={homeWon ? 'text-white' : 'text-gray-400'}>{game.homeScore}</span>
              </div>
            ) : (
              <span className="text-gray-500 font-medium">vs</span>
            )}
            {prediction?.predictedWinner === 'away' && (
              <div className="w-2 h-2 bg-orange-400 rounded-full mx-auto mt-1" />
            )}
          </div>

          {/* Home */}
          <div className={`flex-1 flex items-center gap-2 flex-row-reverse ${homeWon ? 'opacity-100' : awayWon ? 'opacity-50' : ''}`}>
            <img
              src={game.homeTeam.logo}
              alt={game.homeTeam.abbreviation}
              className="w-10 h-10 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div className="min-w-0 text-right">
              <div className={`font-bold text-sm ${homeWon ? 'text-white' : 'text-gray-300'}`}>
                {game.homeTeam.abbreviation}
              </div>
              <div className="text-xs text-gray-500 truncate">{game.homeTeam.record}</div>
            </div>
          </div>
        </div>

        {/* Home indicator */}
        {prediction?.predictedWinner === 'home' && (
          <div className="flex justify-end mt-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full" />
          </div>
        )}

        {game.status === 'postponed' && (
          <div className="mt-3 text-xs text-yellow-500 text-center">Game postponed</div>
        )}

        {game.status !== 'postponed' && (
          <PlayerPropsSection gameId={game.id} gameStatus={game.status} />
        )}
      </div>

      {showModal && (
        <PredictModal
          game={game}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            onPredictionMade?.();
          }}
        />
      )}
    </>
  );
}
