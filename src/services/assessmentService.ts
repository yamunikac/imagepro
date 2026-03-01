import { supabase } from '@/integrations/supabase/client';
import { AssessmentSession, Question, CompetencyProfile } from '@/types/assessment';

export const generateNextQuestion = async (
  session: AssessmentSession,
  performanceSummary: string
): Promise<Question> => {
  const { data, error } = await supabase.functions.invoke('assessment-ai', {
    body: {
      action: 'generate_question',
      session,
      performanceSummary,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Failed to generate question');
  return data.data as Question;
};

export const analyzeCompetency = async (
  session: AssessmentSession,
  questions: Question[]
): Promise<CompetencyProfile> => {
  const { data, error } = await supabase.functions.invoke('assessment-ai', {
    body: {
      action: 'analyze_competency',
      session,
      questions,
    },
  });

  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Failed to analyze competency');
  return data.data as CompetencyProfile;
};
