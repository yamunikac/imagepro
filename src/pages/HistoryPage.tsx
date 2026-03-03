import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Clock, ImageIcon, ArrowRight, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HistoryRow {
  id: string;
  operations_applied: string[];
  created_at: string;
  original_image_url: string | null;
  processed_image_url: string | null;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from('image_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setHistory(data);
        setLoading(false);
      });
  }, [user]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold text-foreground">Processing History</h1>
          </div>

          {!user ? (
            <div className="rounded-2xl border border-surface-border bg-surface p-16 text-center space-y-4">
              <LogIn className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h2 className="font-display text-xl font-semibold text-foreground">Sign in to view history</h2>
              <p className="text-sm text-muted-foreground">Your processing history is saved when you're logged in.</p>
              <button
                onClick={() => navigate('/auth')}
                className="rounded-xl gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all"
              >
                Sign In
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-xl border border-surface-border bg-surface animate-shimmer" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface p-16 text-center space-y-3">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h2 className="font-display text-xl font-semibold text-foreground">No images processed yet</h2>
              <p className="text-sm text-muted-foreground">Start by selecting a tool from the Features page.</p>
              <button
                onClick={() => navigate('/features')}
                className="rounded-xl gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all"
              >
                Explore Features
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center gap-4 rounded-xl border border-surface-border bg-surface p-4 hover:border-primary/30 transition-all"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-surface-border bg-surface-elevated">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5">
                      {h.operations_applied.map((op, i) => (
                        <span key={i} className="rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                          {op}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 font-mono">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
                  {h.processed_image_url && (
                    <a
                      href={h.processed_image_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
                    >
                      View <ArrowRight className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-muted-foreground/60">
        VisionPro Studio · All processing done client-side via Canvas API
      </footer>
    </div>
  );
}
