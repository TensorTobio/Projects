import { NavLink, useNavigate } from 'react-router-dom';
import { Trophy, Home, BarChart2, Users, LogOut, Brain } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  const navItems = [
    { to: '/', icon: Home, label: 'Games' },
    { to: '/dashboard', icon: BarChart2, label: 'Dashboard' },
    { to: '/analytics', icon: Brain, label: 'Analytics' },
    { to: '/leaderboard', icon: Users, label: 'Leaderboard' },
  ];

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 font-bold text-white">
            <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="hidden sm:block">NBA Predict</span>
          </NavLink>

          {/* Nav links */}
          <div className="flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:block">{label}</span>
              </NavLink>
            ))}
          </div>

          {/* User */}
          <div className="flex items-center gap-2">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-bold text-white">
                {(user?.displayName || 'G')[0].toUpperCase()}
              </div>
            )}
            <span className="hidden sm:block text-sm text-gray-300 max-w-[120px] truncate">
              {user?.displayName || 'Guest'}
            </span>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-gray-800 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
