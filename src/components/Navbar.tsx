import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Home, Layout, History, LogOut, Sun, Moon, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Features', path: '/features', icon: Layout },
  { label: 'History', path: '/history', icon: History },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-surface-border bg-surface/80 backdrop-blur-xl px-6">
      {/* Logo */}
      <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-glow-sm">
          <Eye className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="font-display text-base font-bold text-gradient-brand">VisionPro</span>
      </button>

      {/* Nav links */}
      <nav className="hidden sm:flex items-center gap-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                active
                  ? 'bg-primary/10 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {user ? (
          <>
            <div className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" />
              <span className="hidden md:inline max-w-[120px] truncate">{user.email}</span>
            </div>
            <button
              onClick={signOut}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="rounded-lg gradient-brand px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow-sm hover:opacity-90 transition-opacity"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
