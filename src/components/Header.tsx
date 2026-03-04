import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/components/ThemeProvider';
import { Eye, LogIn, LayoutDashboard, Moon, Sun, LogOut, Menu, X } from 'lucide-react';
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-xl flex-shrink-0">
      <div className="flex h-14 items-center px-6">
        {/* Logo — left */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-glow-sm">
              <Eye className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-base font-bold text-gradient-brand">VisionPro</span>
          </button>
        </div>

        {/* Nav — centered */}
        <nav className="hidden sm:flex items-center gap-1 flex-1 justify-center">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200',
                location.pathname === link.path
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              )}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions — right */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-auto sm:ml-0">
          <button
            onClick={toggleTheme}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>

          {user ? (
            <div className="hidden sm:flex items-center gap-2">
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
              className="hidden sm:flex items-center gap-1.5 rounded-lg gradient-brand px-4 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              Get Started
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="sm:hidden flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border text-muted-foreground"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-surface-border bg-surface p-4 space-y-2 animate-fade-in-up">
          {navLinks.map((link) => (
            <button
              key={link.path}
              onClick={() => { navigate(link.path); setMobileOpen(false); }}
              className={cn(
                'block w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                location.pathname === link.path
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-surface-elevated'
              )}
            >
              {link.label}
            </button>
          ))}
          {user ? (
            <>
              <button onClick={() => { navigate('/dashboard'); setMobileOpen(false); }} className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-primary hover:bg-primary/10">Dashboard</button>
              <button onClick={handleLogout} className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10">Logout</button>
            </>
          ) : (
            <button onClick={() => { navigate('/auth'); setMobileOpen(false); }} className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium gradient-brand text-primary-foreground">Get Started</button>
          )}
        </div>
      )}
    </header>
  );
}
