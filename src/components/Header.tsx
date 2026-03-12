import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { Eye, LogIn, LayoutDashboard, Moon, Sun, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { label: 'Home', path: '/' },
  { label: 'Features', path: '/features' },
  { label: 'History', path: '/history' },
];

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center border-b border-surface-border bg-surface/80 backdrop-blur-xl px-6 flex-shrink-0">
      {/* Brand — left */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-glow-sm">
            <Eye className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-bold text-gradient-brand">VisionPro</span>
        </button>
      </div>

      {/* Nav — center */}
      <nav className="flex-1 flex items-center justify-center gap-1">
        {navLinks.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              location.pathname === link.path
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
            )}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
        </button>

        {user ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </button>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="flex items-center gap-1.5 rounded-lg gradient-brand px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all"
          >
            <LogIn className="h-3.5 w-3.5" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
}
