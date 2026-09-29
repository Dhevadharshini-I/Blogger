import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, PenSquare, LogOut, Settings } from 'lucide-react';

type Props = {
  onNavigate: (page: string, postId?: string) => void;
  onSignOut: () => void;
  showBack?: boolean;
  onBack?: () => void;
  backLabel?: string;
};

export default function Navbar({ onNavigate, onSignOut, showBack, onBack, backLabel = 'Back' }: Props) {
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-sky-100">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Left: back button */}
        <div className="flex items-center gap-3 min-w-0">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sky-600 hover:text-sky-800 transition-colors text-sm font-medium shrink-0"
            >
              <span className="text-lg leading-none">‹</span>
              {backLabel}
            </button>
          ) : null}
        </div>

        {/* Center: logo */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 group absolute left-1/2 -translate-x-1/2"
        >
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 tracking-tight hidden sm:inline">Inkwell</span>
        </button>

        {/* Right: user actions */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <>
              <button
                onClick={() => onNavigate('editor')}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Write a post</span>
              </button>

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(!menuOpen)}
                  className="w-9 h-9 bg-sky-100 rounded-full flex items-center justify-center text-sky-700 font-semibold text-sm hover:ring-2 hover:ring-sky-400 transition-all"
                  title={profile?.username}
                >
                  {(profile?.username ?? '?').charAt(0).toUpperCase()}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-sky-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="font-medium text-sm text-slate-900">{profile?.username}</p>
                        <p className="text-xs text-slate-400">Signed in</p>
                      </div>
                      <button
                        onClick={() => { onNavigate('editor'); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 transition-colors"
                      >
                        <PenSquare className="w-4 h-4" />
                        Write a post
                      </button>
                      <button
                        onClick={() => { onNavigate('settings'); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-slate-700 hover:bg-sky-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={() => { onSignOut(); setMenuOpen(false); }}
                        className="w-full flex items-center gap-2 text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="px-4 py-2 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
