import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { History, Calendar, Target, Brain, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SessionRecord {
  id: string;
  total_questions: number;
  correct_count: number;
  accuracy: number;
  avg_response_time: number;
  final_difficulty: string;
  mastery_level: string | null;
  completed_at: string | null;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [records, setRecords] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    (async () => {
      const { data } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      setRecords((data as SessionRecord[]) || []);
      setLoading(false);
    })();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
            <History className="h-7 w-7 text-primary" />
            Test History
          </h1>
          <p className="text-muted-foreground text-sm">All your completed assessments.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No test history yet.</p>
            <button
              onClick={() => navigate('/test')}
              className="rounded-lg gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-sm"
            >
              Start Your First Test
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {records.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/results/${r.id}`)}
                className="w-full rounded-xl border border-surface-border bg-surface p-4 flex items-center gap-4 hover:border-primary/30 transition-colors text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary font-display font-bold">
                  {Number(r.accuracy)}%
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">
                      {r.total_questions} questions
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                      r.mastery_level === 'Advanced' ? 'border-success/30 text-success bg-success/10' :
                      r.mastery_level === 'Intermediate' ? 'border-warning/30 text-warning bg-warning/10' :
                      'border-destructive/30 text-destructive bg-destructive/10'
                    }`}>
                      {r.mastery_level || 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {Math.round(Number(r.avg_response_time))}ms avg</span>
                    <span className="flex items-center gap-1"><Target className="h-3 w-3" /> {r.final_difficulty}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
