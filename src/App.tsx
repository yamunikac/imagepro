import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Landing } from '@/components/adaptiquest/Landing';
import { AssessmentEngine } from '@/components/adaptiquest/AssessmentEngine';
import { Dashboard } from '@/components/adaptiquest/Dashboard';
import { AssessmentSession, Question, CompetencyProfile } from '@/types/assessment';
import { analyzeCompetency } from '@/services/assessmentService';
import { Loader2, Sparkles } from 'lucide-react';

type AppState = 'landing' | 'assessment' | 'analyzing' | 'dashboard';

const App = () => {
  const [state, setState] = useState<AppState>('landing');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [profile, setProfile] = useState<CompetencyProfile | null>(null);

  const handleStart = (topic: string) => {
    setSelectedTopic(topic);
    setState('assessment');
  };

  const handleAssessmentComplete = async (finalSession: AssessmentSession, finalQuestions: Question[]) => {
    setSession(finalSession);
    setQuestions(finalQuestions);
    setState('analyzing');

    try {
      const competencyProfile = await analyzeCompetency(finalSession, finalQuestions);
      setProfile(competencyProfile);
      setState('dashboard');
    } catch (error) {
      console.error('Error analyzing competency:', error);
      setState('assessment');
    }
  };

  const handleRestart = () => {
    setState('landing');
    setSession(null);
    setQuestions([]);
    setProfile(null);
  };

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <div className="min-h-screen bg-background font-sans text-foreground">
        {state === 'landing' && <Landing onStart={handleStart} />}

        {state === 'assessment' && (
          <AssessmentEngine topic={selectedTopic} onComplete={handleAssessmentComplete} />
        )}

        {state === 'analyzing' && (
          <div className="min-h-screen flex flex-col items-center justify-center space-y-6 p-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 text-primary animate-spin relative z-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-foreground">Analyzing Your Performance</h2>
              <p className="text-muted-foreground max-w-md">
                AI is processing your response patterns, efficiency, and adaptive progression to build your competency profile...
              </p>
            </div>
            <div className="flex items-center space-x-2 text-primary font-bold text-sm uppercase tracking-widest">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Insights</span>
            </div>
          </div>
        )}

        {state === 'dashboard' && profile && (
          <Dashboard profile={profile} onRestart={handleRestart} />
        )}
      </div>
    </TooltipProvider>
  );
};

export default App;
