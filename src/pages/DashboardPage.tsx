import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Play, History, Trophy, Target, BarChart3, Clock, TrendingUp } from 'lucide-react';

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

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    (async () => {
      const { data } = await supabase
        .from('test_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);
      setSessions((data as SessionRecord[]) || []);
      setLoading(false);
    })();
  }, [user, navigate]);

  if (!user) return null;

  const totalTests = sessions.length;
  const avgAccuracy = totalTests > 0
    ? Math.round(sessions.reduce((s, r) => s + Number(r.accuracy), 0) / totalTests)
    : 0;
  const bestScore = totalTests > 0
    ? Math.max(...sessions.map(s => Number(s.accuracy)))
    : 0;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome */}
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back! Start a new assessment or review past performance.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Target, label: 'Tests Taken', value: totalTests, color: 'text-primary' },
            { icon: BarChart3, label: 'Avg Accuracy', value: `${avgAccuracy}%`, color: 'text-success' },
            { icon: Trophy, label: 'Best Score', value: `${bestScore}%`, color: 'text-warning' },
            { icon: Clock, label: 'Last Test', value: sessions[0] ? new Date(sessions[0].created_at).toLocaleDateString() : '—', color: 'text-muted-foreground' },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-surface-border bg-surface p-4 space-y-2">
              <div className="flex items-center gap-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/test')}
            className="group rounded-2xl border border-primary/30 bg-primary/5 p-6 text-left hover:bg-primary/10 hover:border-primary/50 transition-all"
          >
            <Play className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-display text-lg font-bold text-foreground">Start Test</h3>
            <p className="text-xs text-muted-foreground mt-1">Begin an adaptive assessment</p>
          </button>
          <button
            onClick={() => navigate('/history')}
            className="group rounded-2xl border border-surface-border bg-surface p-6 text-left hover:border-primary/30 transition-all"
          >
            <History className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-primary transition-colors" />
            <h3 className="font-display text-lg font-bold text-foreground">Test History</h3>
            <p className="text-xs text-muted-foreground mt-1">Review past sessions</p>
          </button>
          <button
            onClick={() => navigate('/leaderboard')}
            className="group rounded-2xl border border-surface-border bg-surface p-6 text-left hover:border-primary/30 transition-all"
          >
            <Trophy className="h-8 w-8 text-muted-foreground mb-3 group-hover:text-warning transition-colors" />
            <h3 className="font-display text-lg font-bold text-foreground">Leaderboard</h3>
            <p className="text-xs text-muted-foreground mt-1">See top performers</p>
          </button>
        </div>

        {/* Recent Sessions */}
        {!loading && sessions.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Recent Tests
            </h2>
            <div className="space-y-2">
              {sessions.slice(0, 5).map(s => (
                <button
                  key={s.id}
                  onClick={() => navigate(`/results/${s.id}`)}
                  className="w-full rounded-xl border border-surface-border bg-surface p-4 flex items-center gap-4 hover:border-primary/30 transition-colors text-left"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-display font-bold text-sm">
                    {Number(s.accuracy)}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {s.total_questions} questions · {s.mastery_level || 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()} · Avg {Math.round(Number(s.avg_response_time))}ms
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                    s.final_difficulty === 'hard' ? 'border-destructive/30 text-destructive bg-destructive/10' :
                    s.final_difficulty === 'medium' ? 'border-warning/30 text-warning bg-warning/10' :
                    'border-success/30 text-success bg-success/10'
                  }`}>
                    {s.final_difficulty}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}
