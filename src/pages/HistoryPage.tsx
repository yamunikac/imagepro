import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Header from '@/components/Header';
import { Clock, ImageIcon, Download, Trash2, LogIn, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const fetchHistory = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('image_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setHistory(data);
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, [user]);

  const handleDelete = async (id: string) => {
    await supabase.from('image_history').delete().eq('id', id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleDownload = (url: string, ops: string[]) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `visionpro-${ops.join('-')}-${Date.now()}.png`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 px-6 py-12">
        <div className="max-w-5xl mx-auto">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-xl border border-surface-border bg-surface animate-shimmer" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-surface p-16 text-center space-y-3">
              <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/30" />
              <h2 className="font-display text-xl font-semibold text-foreground">No images processed yet</h2>
              <p className="text-sm text-muted-foreground">Process an image and download it to save to history.</p>
              <button
                onClick={() => navigate('/features')}
                className="rounded-xl gradient-brand px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm hover:shadow-glow transition-all"
              >
                Explore Features
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="group rounded-xl border border-surface-border bg-surface overflow-hidden hover:border-primary/30 transition-all"
                >
                  {/* Image preview */}
                  <div
                    className="relative h-48 bg-surface-elevated cursor-pointer flex items-center justify-center overflow-hidden"
                    onClick={() => setPreviewUrl(h.processed_image_url || h.original_image_url)}
                  >
                    {h.processed_image_url ? (
                      <img
                        src={h.processed_image_url}
                        alt="Processed"
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      <ImageIcon className="h-12 w-12 text-muted-foreground/20" />
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-xs font-medium text-foreground">Click to preview</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <div className="flex flex-wrap gap-1">
                      {h.operations_applied.map((op, i) => (
                        <span key={i} className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {op}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      {new Date(h.created_at).toLocaleString()}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      {h.processed_image_url && (
                        <button
                          onClick={() => handleDownload(h.processed_image_url!, h.operations_applied)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-all"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(h.id)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Full-screen preview modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-8"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full border border-surface-border bg-surface text-foreground hover:bg-surface-elevated transition-all"
            onClick={() => setPreviewUrl(null)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={previewUrl}
            alt="Preview"
            className="max-h-full max-w-full object-contain rounded-xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <footer className="border-t border-surface-border bg-surface px-6 py-4 text-center text-xs text-muted-foreground/60">
        VisionPro Studio · All processing done client-side via Canvas API
      </footer>
    </div>
  );
}
