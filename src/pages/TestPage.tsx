import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Progress } from '@/components/ui/progress';
import {
  createInitialState, processAnswer, getAccuracy, getAvgResponseTime,
  getMasteryLevel, analyzeTopics, type AdaptiveState, type Difficulty
} from '@/lib/adaptiveEngine';
import { Brain, Clock, Target, CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  difficulty: string;
  topic: string;
}

const TOTAL_QUESTIONS = 15;
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'border-success/30 text-success bg-success/10',
  medium: 'border-warning/30 text-warning bg-warning/10',
  hard: 'border-destructive/30 text-destructive bg-destructive/10',
};

export default function TestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [state, setState] = useState<AdaptiveState>(createInitialState());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [usedQuestionIds, setUsedQuestionIds] = useState<string[]>([]);
  const timerRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    // Create session
    (async () => {
      const { data } = await supabase
        .from('test_sessions')
        .insert({ user_id: user.id, status: 'in_progress' })
        .select('id')
        .single();
      if (data) setSessionId(data.id);
    })();
  }, [user, navigate]);

  const fetchQuestion = useCallback(async (difficulty: Difficulty, excludeIds: string[]) => {
    setLoading(true);
    let query = supabase
      .from('questions')
      .select('*')
      .eq('difficulty', difficulty);
    
    if (excludeIds.length > 0) {
      query = query.not('id', 'in', `(${excludeIds.join(',')})`);
    }
    
    const { data } = await query;
    if (!data || data.length === 0) {
      // Fallback: try any difficulty
      const { data: fallback } = await supabase
        .from('questions')
        .select('*')
        .not('id', 'in', `(${excludeIds.join(',')})`);
      if (fallback && fallback.length > 0) {
        const q = fallback[Math.floor(Math.random() * fallback.length)];
        setCurrentQuestion(q as Question);
      }
    } else {
      const q = data[Math.floor(Math.random() * data.length)];
      setCurrentQuestion(q as Question);
    }
    timerRef.current = Date.now();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (sessionId && state.totalQuestions < TOTAL_QUESTIONS) {
      fetchQuestion(state.currentDifficulty, usedQuestionIds);
    }
  }, [sessionId]); // Only on session start

  const handleAnswer = async (answer: string) => {
    if (showResult || !currentQuestion || !sessionId || !user || submitting) return;
    setSelectedAnswer(answer);
    setShowResult(true);
    setSubmitting(true);

    const responseTime = Date.now() - timerRef.current;
    const isCorrect = answer === currentQuestion.correct_answer;

    // Record response
    await supabase.from('test_responses').insert({
      session_id: sessionId,
      question_id: currentQuestion.id,
      user_id: user.id,
      selected_answer: answer,
      is_correct: isCorrect,
      response_time_ms: responseTime,
      difficulty_at_time: currentQuestion.difficulty,
      question_number: state.totalQuestions + 1,
    });

    const newState = processAnswer(
      state, isCorrect, responseTime,
      currentQuestion.difficulty as Difficulty,
      currentQuestion.topic
    );
    setState(newState);
    setUsedQuestionIds(prev => [...prev, currentQuestion.id]);
    setSubmitting(false);
  };

  const nextQuestion = async () => {
    if (state.totalQuestions >= TOTAL_QUESTIONS) {
      // End test
      await finishTest();
      return;
    }
    setSelectedAnswer(null);
    setShowResult(false);
    fetchQuestion(state.currentDifficulty, [...usedQuestionIds]);
  };

  const finishTest = async () => {
    if (!sessionId || !user) return;
    const accuracy = getAccuracy(state);
    const avgTime = getAvgResponseTime(state);
    const mastery = getMasteryLevel(state);

    await supabase.from('test_sessions').update({
      status: 'completed',
      total_questions: state.totalQuestions,
      correct_count: state.totalCorrect,
      incorrect_count: state.totalIncorrect,
      accuracy,
      avg_response_time: avgTime,
      final_difficulty: state.currentDifficulty,
      mastery_level: mastery,
      completed_at: new Date().toISOString(),
    }).eq('id', sessionId);

    // Get profile for name
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    // Add to leaderboard
    await supabase.from('leaderboard').insert({
      user_id: user.id,
      user_name: (profile as any)?.name || 'Anonymous',
      score: accuracy,
      total_questions: state.totalQuestions,
      avg_response_time: avgTime,
      mastery_level: mastery,
    });

    navigate(`/results/${sessionId}`);
  };

  if (!user) return null;

  const progress = (state.totalQuestions / TOTAL_QUESTIONS) * 100;
  const options = currentQuestion ? [
    { key: 'A', text: currentQuestion.option_a },
    { key: 'B', text: currentQuestion.option_b },
    { key: 'C', text: currentQuestion.option_c },
    { key: 'D', text: currentQuestion.option_d },
  ] : [];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Header stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary" />
            <span className="font-display text-sm font-bold text-foreground">
              Question {Math.min(state.totalQuestions + 1, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold border uppercase', DIFFICULTY_COLORS[state.currentDifficulty])}>
              {state.currentDifficulty}
            </span>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              {getAccuracy(state)}%
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <Progress value={progress} className="h-2" />

        {/* Live stats bar */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-success" /> {state.totalCorrect} correct</span>
          <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-destructive" /> {state.totalIncorrect} incorrect</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Avg {getAvgResponseTime(state)}ms</span>
        </div>

        {/* Question Card */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : currentQuestion ? (
          <div className="rounded-2xl border border-surface-border bg-surface p-6 space-y-6 animate-fade-in-up">
            {/* Topic badge */}
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-surface-border bg-surface-elevated px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {currentQuestion.topic}
              </span>
            </div>

            {/* Question text */}
            <h2 className="font-display text-xl font-bold text-foreground leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            {/* Options */}
            <div className="grid gap-3">
              {options.map(opt => {
                const isSelected = selectedAnswer === opt.key;
                const isCorrectOpt = currentQuestion.correct_answer === opt.key;
                let optClass = 'border-surface-border bg-surface-elevated hover:border-primary/50 hover:bg-primary/5 cursor-pointer';
                
                if (showResult) {
                  if (isCorrectOpt) {
                    optClass = 'border-success bg-success/10 text-success';
                  } else if (isSelected && !isCorrectOpt) {
                    optClass = 'border-destructive bg-destructive/10 text-destructive';
                  } else {
                    optClass = 'border-surface-border bg-surface-elevated opacity-50';
                  }
                } else if (isSelected) {
                  optClass = 'border-primary bg-primary/10';
                }

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswer(opt.key)}
                    disabled={showResult}
                    className={cn(
                      'w-full rounded-xl border p-4 text-left transition-all flex items-center gap-3',
                      optClass
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-current/20 text-sm font-bold flex-shrink-0">
                      {opt.key}
                    </span>
                    <span className="text-sm font-medium">{opt.text}</span>
                    {showResult && isCorrectOpt && <CheckCircle2 className="h-4 w-4 ml-auto text-success" />}
                    {showResult && isSelected && !isCorrectOpt && <XCircle className="h-4 w-4 ml-auto text-destructive" />}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            {showResult && (
              <div className="flex justify-end">
                <button
                  onClick={nextQuestion}
                  className="flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-glow-sm hover:opacity-90 transition-opacity"
                >
                  {state.totalQuestions >= TOTAL_QUESTIONS ? 'Finish Test' : 'Next Question'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
