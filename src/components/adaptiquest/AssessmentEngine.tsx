import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Timer, Brain, CheckCircle2, XCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Question, AssessmentSession, AssessmentResponse, Difficulty } from '@/types/assessment';
import { generateNextQuestion } from '@/services/assessmentService';

interface AssessmentEngineProps {
  topic: string;
  onComplete: (session: AssessmentSession, questions: Question[]) => void;
}

export const AssessmentEngine: React.FC<AssessmentEngineProps> = ({ topic, onComplete }) => {
  const [session, setSession] = useState<AssessmentSession>({
    id: Math.random().toString(36).substr(2, 9),
    startTime: Date.now(),
    responses: [],
    currentDifficulty: Difficulty.BEGINNER,
    topic,
  });

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState(Date.now());

  const MAX_QUESTIONS = 5;

  const fetchNextQuestion = async (currentSession: AssessmentSession) => {
    setIsLoading(true);
    try {
      const performanceSummary =
        currentSession.responses.length > 0
          ? `Last ${currentSession.responses.length} questions: ${currentSession.responses.filter((r) => r.isCorrect).length} correct. Average response time: ${currentSession.responses.reduce((acc, r) => acc + r.responseTimeMs, 0) / currentSession.responses.length}ms.`
          : 'Initial question.';

      const nextQ = await generateNextQuestion(currentSession, performanceSummary);
      setQuestions((prev) => [...prev, nextQ]);
      setCurrentQuestion(nextQ);
      setStartTime(Date.now());
    } catch (error) {
      console.error('Failed to fetch question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNextQuestion(session);
  }, []);

  const handleOptionSelect = (index: number) => {
    if (isSubmitting) return;
    setSelectedOption(index);
  };

  const handleSubmit = async () => {
    if (selectedOption === null || !currentQuestion) return;

    setIsSubmitting(true);
    const responseTime = Date.now() - startTime;
    const isCorrect = selectedOption === currentQuestion.correctAnswerIndex;

    const newResponse: AssessmentResponse = {
      questionId: currentQuestion.id,
      selectedOptionIndex: selectedOption,
      isCorrect,
      responseTimeMs: responseTime,
      timestamp: Date.now(),
    };

    const updatedResponses = [...session.responses, newResponse];

    let nextDifficulty = session.currentDifficulty;
    const recentResponses = updatedResponses.slice(-3);
    const correctCount = recentResponses.filter((r) => r.isCorrect).length;

    if (correctCount === 3 && session.currentDifficulty !== Difficulty.ADVANCED) {
      nextDifficulty = session.currentDifficulty === Difficulty.BEGINNER ? Difficulty.INTERMEDIATE : Difficulty.ADVANCED;
    } else if (correctCount === 0 && session.currentDifficulty !== Difficulty.BEGINNER) {
      nextDifficulty = session.currentDifficulty === Difficulty.ADVANCED ? Difficulty.INTERMEDIATE : Difficulty.BEGINNER;
    }

    const updatedSession = { ...session, responses: updatedResponses, currentDifficulty: nextDifficulty };
    setSession(updatedSession);

    setTimeout(() => {
      setSelectedOption(null);
      setIsSubmitting(false);

      if (updatedResponses.length >= MAX_QUESTIONS) {
        onComplete({ ...updatedSession, endTime: Date.now() }, [...questions, currentQuestion]);
      } else {
        fetchNextQuestion(updatedSession);
      }
    }, 1500);
  };

  if (isLoading && !currentQuestion) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-lg font-medium text-muted-foreground">Generating your adaptive assessment...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">{topic}</h2>
            <p className="text-sm text-muted-foreground">
              Question {session.responses.length + 1} of {MAX_QUESTIONS}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="flex flex-col items-end">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Difficulty</span>
            <span
              className={`text-sm font-bold ${
                session.currentDifficulty === Difficulty.ADVANCED
                  ? 'text-destructive'
                  : session.currentDifficulty === Difficulty.INTERMEDIATE
                  ? 'text-warning'
                  : 'text-success'
              }`}
            >
              {session.currentDifficulty}
            </span>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="flex items-center space-x-2 text-muted-foreground">
            <Timer className="w-5 h-5" />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-2xl shadow-studio-lg border border-border overflow-hidden">
        <div className="h-2 bg-muted w-full">
          <motion.div className="h-full gradient-brand" initial={{ width: 0 }} animate={{ width: `${(session.responses.length / MAX_QUESTIONS) * 100}%` }} />
        </div>

        <div className="p-8">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center py-12 space-y-4">
                <Sparkles className="w-8 h-8 text-primary/50 animate-pulse" />
                <p className="text-muted-foreground italic">Adapting to your performance...</p>
              </motion.div>
            ) : (
              currentQuestion && (
                <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                  <div className="space-y-4">
                    <span className="inline-block px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-bold uppercase tracking-wider">{currentQuestion.subtopic}</span>
                    <h3 className="text-2xl font-display font-semibold text-foreground leading-tight">{currentQuestion.text}</h3>
                  </div>

                  <div className="grid gap-4">
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = selectedOption === index;
                      const isCorrect = index === currentQuestion.correctAnswerIndex;
                      const showFeedback = isSubmitting;

                      return (
                        <button
                          key={index}
                          onClick={() => handleOptionSelect(index)}
                          disabled={isSubmitting}
                          className={`group relative flex items-center p-5 rounded-xl border-2 transition-all duration-200 text-left ${
                            isSelected
                              ? showFeedback
                                ? isCorrect
                                  ? 'bg-success/10 border-success'
                                  : 'bg-destructive/10 border-destructive'
                                : 'bg-primary/5 border-primary'
                              : 'bg-card border-border hover:border-primary/30 hover:bg-muted'
                          }`}
                        >
                          <div
                            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mr-4 font-bold transition-colors ${
                              isSelected
                                ? showFeedback
                                  ? isCorrect
                                    ? 'bg-success text-success-foreground'
                                    : 'bg-destructive text-destructive-foreground'
                                  : 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className={`flex-grow font-medium ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>{option}</span>
                          {showFeedback && isCorrect && <CheckCircle2 className="w-6 h-6 text-success ml-4" />}
                          {showFeedback && isSelected && !isCorrect && <XCircle className="w-6 h-6 text-destructive ml-4" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      onClick={handleSubmit}
                      disabled={selectedOption === null || isSubmitting}
                      className={`flex items-center px-8 py-3 rounded-xl font-bold transition-all ${
                        selectedOption === null || isSubmitting
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'gradient-brand text-primary-foreground hover:opacity-90 shadow-glow'
                      }`}
                    >
                      {isSubmitting ? 'Evaluating...' : 'Submit Answer'}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>

                  {isSubmitting && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-6 bg-muted rounded-xl border border-border">
                      <h4 className="font-display font-bold text-foreground mb-2">Explanation</h4>
                      <p className="text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p>
                    </motion.div>
                  )}
                </motion.div>
              )
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
