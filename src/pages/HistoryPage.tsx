import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { History, ImageIcon, Calendar, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface HistoryRecord {
  id: string;
  operations_applied: string[];
  created_at: string;
  original_image_url: string | null;
  processed_image_url: string | null;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('image_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setRecords((data as HistoryRecord[]) || []);
      setLoading(false);
    })();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
            <History className="h-7 w-7 text-primary" />
            Activity History
          </h1>
          <p className="text-muted-foreground text-sm">All your processed images and operations.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No processing history yet.</p>
            <button
              onClick={() => navigate('/features')}
              className="rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-sm"
            >
              Start Processing
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-surface-border bg-surface p-4 flex items-center gap-4 hover:border-primary/30 transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {r.operations_applied.map((op, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-medium text-primary">
                        <Tag className="h-2.5 w-2.5" />
                        {op}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
