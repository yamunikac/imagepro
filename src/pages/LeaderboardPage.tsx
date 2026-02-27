import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Medal, Crown, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  user_name: string;
  score: number;
  total_questions: number;
  avg_response_time: number;
  mastery_level: string | null;
  created_at: string;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('leaderboard')
        .select('*')
        .order('score', { ascending: false })
        .limit(50);
      setEntries((data as LeaderboardEntry[]) || []);
      setLoading(false);
    })();
  }, []);

  const getRankIcon = (index: number) => {
    if (index === 0) return <Crown className="h-5 w-5 text-warning" />;
    if (index === 1) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (index === 2) return <Medal className="h-5 w-5 text-warning/60" />;
    return <span className="text-xs font-bold text-muted-foreground w-5 text-center">{index + 1}</span>;
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-7 w-7 text-warning" />
            Leaderboard
          </h1>
          <p className="text-muted-foreground text-sm">Top performers across all assessments.</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto" />
            <p className="text-muted-foreground">No entries yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, idx) => {
              const isCurrentUser = user && entry.user_id === user.id;
              return (
                <div
                  key={entry.id}
                  className={`rounded-xl border p-4 flex items-center gap-4 transition-colors ${
                    isCurrentUser
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-surface-border bg-surface'
                  }`}
                >
                  <div className="flex items-center justify-center w-8">
                    {getRankIcon(idx)}
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0">
                    {entry.user_name[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {entry.user_name}
                      {isCurrentUser && <span className="text-primary text-xs ml-1">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.total_questions} questions · {Math.round(Number(entry.avg_response_time))}ms avg
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-primary">{Number(entry.score)}%</p>
                    <p className={`text-[10px] font-medium ${
                      entry.mastery_level === 'Advanced' ? 'text-success' :
                      entry.mastery_level === 'Intermediate' ? 'text-warning' : 'text-muted-foreground'
                    }`}>
                      {entry.mastery_level || 'N/A'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
