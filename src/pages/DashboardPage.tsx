import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Eye, LogOut, User, Layers, Sparkles, Minimize2, FileSymlink,
  Crop, RotateCw, Eraser, ArrowRight, Image as ImageIcon, Clock, Hash
} from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  { icon: Layers, title: 'Filters Studio', path: '/studio', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { icon: Sparkles, title: 'Enhance', path: '/enhance', color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20' },
  { icon: Minimize2, title: 'Compress', path: '/compress', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  { icon: FileSymlink, title: 'Convert', path: '/convert', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  { icon: Crop, title: 'Crop', path: '/crop', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  { icon: RotateCw, title: 'Rotate', path: '/rotate', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
  { icon: Eraser, title: 'Remove BG', path: '/remove-bg', color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
];

interface HistoryRow {
  id: string;
  operations_applied: string[];
  created_at: string;
  original_image_url: string | null;
  processed_image_url: string | null;
}

export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name: string; email: string; images_processed: number } | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('name, email, images_processed').eq('id', user.id).single()
      .then(({ data }) => { if (data) setProfile(data); });
    supabase.from('image_history').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => { if (data) setHistory(data); });
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex h-14 items-center justify-between border-b border-surface-border bg-surface px-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand shadow-glow-sm">
            <Eye className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-base font-bold text-gradient-brand">VisionPro</span>
          <span className="ml-1 text-xs text-muted-foreground hidden sm:inline">Dashboard</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Tools
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/20 transition-all"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Profile card */}
          <div className="rounded-2xl border border-surface-border bg-surface p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-xl font-bold text-foreground">{profile?.name || 'User'}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email || user?.email}</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center px-4 py-2 rounded-xl border border-surface-border bg-surface-elevated">
                  <div className="flex items-center gap-1 text-primary">
                    <ImageIcon className="h-4 w-4" />
                    <span className="font-display text-lg font-bold">{profile?.images_processed ?? 0}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Images Processed</p>
                </div>
                <div className="text-center px-4 py-2 rounded-xl border border-surface-border bg-surface-elevated">
                  <div className="flex items-center gap-1 text-primary">
                    <Hash className="h-4 w-4" />
                    <span className="font-display text-lg font-bold">{history.length}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">History Items</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick access tools */}
          <div>
            <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Access Tools</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {tools.map((t) => (
                <button
                  key={t.path}
                  onClick={() => navigate(t.path)}
                  className={cn(
                    'group flex flex-col items-center gap-2 rounded-xl border p-4 transition-all hover:-translate-y-0.5',
                    t.bg
                  )}
                >
                  <t.icon className={cn('h-6 w-6', t.color)} />
                  <span className="text-xs font-medium text-foreground">{t.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Activity History */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-primary" />
              <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">Activity History</h3>
            </div>
            {history.length === 0 ? (
              <div className="rounded-2xl border border-surface-border bg-surface p-12 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No images processed yet</p>
                <p className="text-xs text-muted-foreground/50 mt-1">Start by selecting a tool above</p>
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center gap-4 rounded-xl border border-surface-border bg-surface p-4 hover:border-primary/30 transition-all"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        {h.operations_applied.map((op, i) => (
                          <span key={i} className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                            {op}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {new Date(h.created_at).toLocaleString()}
                      </p>
                    </div>
                    {h.processed_image_url && (
                      <a
                        href={h.processed_image_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
                      >
                        View <ArrowRight className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
