import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Trophy, TrendingUp, Brain, Users } from 'lucide-react';

export default function LoginPage() {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogle() {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setError(e.message || 'Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGuest() {
    setLoading(true);
    setError('');
    try {
      await signInAsGuest();
    } catch (e: any) {
      setError(e.message || 'Guest sign in failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-500 mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">NBA Predict</h1>
          <p className="text-gray-400 mt-2">Sharpen your basketball intuition</p>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: TrendingUp, label: 'Real NBA Games', desc: 'Live ESPN data' },
            { icon: Trophy, label: 'Earn Points', desc: 'Climb the leaderboard' },
            { icon: Brain, label: 'AI Insights', desc: 'Behavioral analytics' },
            { icon: Users, label: 'Compete', desc: 'Global rankings' },
          ].map(({ icon: Icon, label, desc }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-orange-400" />
              </div>
              <div>
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-gray-500">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Sign in card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Get Started</h2>
          <p className="text-sm text-gray-400 mb-5">No real money — just pure skill development</p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl transition-colors mb-3 disabled:opacity-50"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
            Continue with Google
          </button>

          <button
            onClick={handleGuest}
            disabled={loading}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors disabled:opacity-50"
          >
            Play as Guest
          </button>

          <p className="text-xs text-gray-600 text-center mt-4">
            Guest progress is tied to this device. Sign in with Google to save across devices.
          </p>
        </div>
      </div>
    </div>
  );
}
