export enum Difficulty {
  BEGINNER = "Beginner",
  INTERMEDIATE = "Intermediate",
  ADVANCED = "Advanced"
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  difficulty: Difficulty;
  topic: string;
  subtopic: string;
}

export interface AssessmentResponse {
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
  responseTimeMs: number;
  timestamp: number;
}

export interface AssessmentSession {
  id: string;
  startTime: number;
  endTime?: number;
  responses: AssessmentResponse[];
  currentDifficulty: Difficulty;
  topic: string;
}

export interface CompetencyLevel {
  topic: string;
  subtopic: string;
  level: Difficulty;
  score: number;
  accuracy: number;
  averageResponseTime: number;
}

export interface CompetencyProfile {
  overallLevel: Difficulty;
  topicMastery: CompetencyLevel[];
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
}
