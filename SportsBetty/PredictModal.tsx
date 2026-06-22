import { useState } from 'react';
import type { NBAGame } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { submitPrediction } from '../../services/predictions';
import { X, Zap } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface Props {
  game: NBAGame;
  onClose: () => void;
  onSuccess: () => void;
}

const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Very unsure', 2: 'Unlikely', 3: 'Slight lean',
  4: 'Lean', 5: 'Moderate', 6: 'Fairly confident',
  7: 'Confident', 8: 'Very confident', 9: 'Near certain', 10: 'Lock',
};

export default function PredictModal({ game, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<'home' | 'away' | null>(null);
  const [confidence, setConfidence] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!user || !selected) return;
    setLoading(true);
    setError('');

    try {
      await submitPrediction(user.uid, {
        gameId: game.id,
        predictedWinner: selected,
        confidence,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        gameDate: game.date,
        gameStatus: game.status,
      });
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Failed to submit prediction.');
    } finally {
      setLoading(false);
    }
  }

  const potentialPoints =
    10 + (confidence > 5 ? (confidence - 5) * 2 : 0);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="font-bold text-white text-lg">Make Your Prediction</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {format(parseISO(game.date), 'EEE, MMM d · h:mm a')}
            </p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Team selection */}
          <div>
            <p className="text-sm text-gray-400 mb-3">Who wins this game?</p>
            <div className="grid grid-cols-2 gap-3">
              {(['away', 'home'] as const).map((side) => {
                const team = side === 'home' ? game.homeTeam : game.awayTeam;
                const isSelected = selected === side;
                return (
                  <button
                    key={side}
                    onClick={() => setSelected(side)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <img
                      src={team.logo}
                      alt={team.abbreviation}
                      className="w-12 h-12 object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="text-center">
                      <div className="font-bold text-white text-sm">{team.abbreviation}</div>
                      <div className="text-xs text-gray-500">{team.record}</div>
                      <div className="text-xs text-gray-600 mt-0.5">{side === 'home' ? 'Home' : 'Away'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Confidence */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-400">Confidence Level</p>
              <span className="text-sm font-bold text-orange-400">{confidence}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full accent-orange-500 cursor-pointer"
            />
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-600">Unsure</span>
              <span className="text-xs text-orange-400 font-medium">{CONFIDENCE_LABELS[confidence]}</span>
              <span className="text-xs text-gray-600">Lock</span>
            </div>
          </div>

          {/* Points preview */}
          <div className="bg-gray-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Zap className="w-4 h-4 text-yellow-400" />
              Points if correct
            </div>
            <div className="font-bold text-white">+{potentialPoints} pts</div>
          </div>

          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-800">
          <button
            onClick={handleSubmit}
            disabled={!selected || loading}
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : selected ? `Predict ${selected === 'home' ? game.homeTeam.abbreviation : game.awayTeam.abbreviation} wins` : 'Select a team to predict'}
          </button>
          <p className="text-xs text-gray-600 text-center mt-3">
            For entertainment only · No real money involved
          </p>
        </div>
      </div>
    </div>
  );
}
