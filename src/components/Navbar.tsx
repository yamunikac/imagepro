import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Eye, Home, Layout, History, LogOut, User, Mail, Hash, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

const navItems = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Features', path: '/features', icon: Layout },
  { label: 'History', path: '/history', icon: History },
];

interface Profile {
  name: string;
  email: string;
  images_processed: number;
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('name, email, images_processed')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setProfile(data as Profile);
        });
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {(profile?.name?.[0] || user.email?.[0] || 'U').toUpperCase()}
              </div>
              <span className="hidden md:inline max-w-[120px] truncate">{user.email}</span>
              <ChevronDown className={cn('h-3 w-3 transition-transform', profileOpen && 'rotate-180')} />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-xl border border-surface-border bg-surface-elevated shadow-studio-lg p-4 space-y-4 animate-fade-in-up z-50">
                {/* Profile header */}
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold">
                    {(profile?.name?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-bold text-foreground truncate">{profile?.name || 'User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>

                <div className="border-t border-surface-border" />

                {/* Profile details */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <User className="h-3.5 w-3.5" />
                    <span>Name:</span>
                    <span className="ml-auto font-medium text-foreground">{profile?.name || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email:</span>
                    <span className="ml-auto font-medium text-foreground truncate max-w-[140px]">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Hash className="h-3.5 w-3.5" />
                    <span>Images processed:</span>
                    <span className="ml-auto font-medium text-foreground">{profile?.images_processed ?? 0}</span>
                  </div>
                </div>

                <div className="border-t border-surface-border" />

                {/* Actions */}
                <div className="space-y-1">
                  <button
                    onClick={() => { setProfileOpen(false); navigate('/history'); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-surface transition-colors"
                  >
                    <History className="h-3.5 w-3.5" />
                    View History
                  </button>
                  <button
                    onClick={() => { setProfileOpen(false); signOut(); }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
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
