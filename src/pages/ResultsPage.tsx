import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Brain, Target, Clock, Trophy, TrendingUp, TrendingDown, Minus, ArrowLeft, Download } from 'lucide-react';

interface Session {
  id: string;
  total_questions: number;
  correct_count: number;
  incorrect_count: number;
  accuracy: number;
  avg_response_time: number;
  final_difficulty: string;
  mastery_level: string | null;
  completed_at: string | null;
}

interface Response {
  id: string;
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  response_time_ms: number;
  difficulty_at_time: string;
  question_number: number;
}

export default function ResultsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) { navigate('/auth'); return; }
    (async () => {
      const [sessionRes, responsesRes] = await Promise.all([
        supabase.from('test_sessions').select('*').eq('id', id).eq('user_id', user.id).single(),
        supabase.from('test_responses').select('*').eq('session_id', id).eq('user_id', user.id).order('question_number'),
      ]);
      if (sessionRes.data) setSession(sessionRes.data as Session);
      if (responsesRes.data) setResponses(responsesRes.data as Response[]);
      setLoading(false);
    })();
  }, [user, id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Session not found.</p>
      </div>
    );
  }

  // Topic analysis from responses
  const topicMap: Record<string, { correct: number; total: number }> = {};
  responses.forEach(r => {
    const topic = r.difficulty_at_time; // We'll use difficulty as proxy; ideally join with questions
    // For proper topic analysis we'd need question data - simplified here
  });

  // Compute topic stats from difficulty distribution
  const difficultyBreakdown = responses.reduce((acc, r) => {
    if (!acc[r.difficulty_at_time]) acc[r.difficulty_at_time] = { correct: 0, total: 0 };
    acc[r.difficulty_at_time].total += 1;
    if (r.is_correct) acc[r.difficulty_at_time].correct += 1;
    return acc;
  }, {} as Record<string, { correct: number; total: number }>);

  const accuracy = Number(session.accuracy);
  const mastery = session.mastery_level || 'N/A';
  const masteryColor = mastery === 'Advanced' ? 'text-success' : mastery === 'Intermediate' ? 'text-warning' : 'text-destructive';

  const downloadReport = () => {
    const lines = [
      'AdaptiveIQ - Assessment Report',
      '================================',
      `Date: ${session.completed_at ? new Date(session.completed_at).toLocaleString() : 'N/A'}`,
      `Total Questions: ${session.total_questions}`,
      `Correct: ${session.correct_count}`,
      `Incorrect: ${session.incorrect_count}`,
      `Accuracy: ${accuracy}%`,
      `Avg Response Time: ${Math.round(Number(session.avg_response_time))}ms`,
      `Final Difficulty: ${session.final_difficulty}`,
      `Mastery Level: ${mastery}`,
      '',
      'Difficulty Breakdown:',
      ...Object.entries(difficultyBreakdown).map(([d, s]) =>
        `  ${d}: ${s.correct}/${s.total} (${Math.round((s.correct / s.total) * 100)}%)`
      ),
      '',
      'Response Timeline:',
      ...responses.map(r =>
        `  Q${r.question_number}: ${r.is_correct ? '✓' : '✗'} (${r.difficulty_at_time}) - ${r.response_time_ms}ms`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `AdaptiveIQ-Report-${session.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mb-2">
              <ArrowLeft className="h-3 w-3" /> Back to Dashboard
            </button>
            <h1 className="font-display text-3xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-7 w-7 text-primary" />
              Assessment Report
            </h1>
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>

        {/* Score Card */}
        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-8 text-center space-y-4">
          <div className="font-display text-6xl font-bold text-primary">{accuracy}%</div>
          <p className={`font-display text-xl font-bold ${masteryColor}`}>{mastery}</p>
          <p className="text-sm text-muted-foreground">
            {session.correct_count} correct out of {session.total_questions} questions
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Target, label: 'Accuracy', value: `${accuracy}%` },
            { icon: Clock, label: 'Avg Time', value: `${Math.round(Number(session.avg_response_time))}ms` },
            { icon: Brain, label: 'Final Difficulty', value: session.final_difficulty },
            { icon: Trophy, label: 'Mastery', value: mastery },
          ].map(s => (
            <div key={s.label} className="rounded-xl border border-surface-border bg-surface p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </div>
              <p className="font-display text-lg font-bold text-foreground capitalize">{s.value}</p>
            </div>
          ))}
        </div>

        {/* Difficulty Breakdown */}
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Difficulty Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(difficultyBreakdown).map(([diff, stats]) => {
              const pct = Math.round((stats.correct / stats.total) * 100);
              return (
                <div key={diff} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize font-medium text-foreground">{diff}</span>
                    <span className="text-muted-foreground">{stats.correct}/{stats.total} ({pct}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Response Timeline */}
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Response Timeline</h2>
          <div className="grid grid-cols-5 sm:grid-cols-10 md:grid-cols-15 gap-2">
            {responses.map(r => (
              <div
                key={r.id}
                title={`Q${r.question_number}: ${r.is_correct ? 'Correct' : 'Wrong'} (${r.difficulty_at_time}) - ${r.response_time_ms}ms`}
                className={`h-10 w-full rounded-lg flex items-center justify-center text-[10px] font-bold border ${
                  r.is_correct
                    ? 'border-success/30 bg-success/10 text-success'
                    : 'border-destructive/30 bg-destructive/10 text-destructive'
                }`}
              >
                {r.question_number}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Recommendations</h2>
          <div className="space-y-2 text-sm text-muted-foreground">
            {accuracy < 50 && <p>• Focus on building strong fundamentals across all topics.</p>}
            {accuracy >= 50 && accuracy < 75 && <p>• Good progress! Practice harder difficulty questions to improve.</p>}
            {accuracy >= 75 && <p>• Excellent performance! Challenge yourself with advanced topics.</p>}
            {Object.entries(difficultyBreakdown).map(([diff, stats]) => {
              const pct = Math.round((stats.correct / stats.total) * 100);
              if (pct < 50) return <p key={diff}>• You need more practice with {diff} difficulty questions.</p>;
              return null;
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/test')}
            className="flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
          >
            Retake Test
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
