// Adaptive Testing Engine — Weighted scoring with confidence-based difficulty adjustment

export type Difficulty = 'easy' | 'medium' | 'hard';

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const DIFFICULTY_WEIGHT: Record<Difficulty, number> = { easy: 1, medium: 2, hard: 3 };

export interface AdaptiveState {
  currentDifficulty: Difficulty;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalQuestions: number;
  totalResponseTimeMs: number;
  topicStats: Record<string, { correct: number; total: number }>;
  weightedScore: number;
  maxWeightedScore: number;
  confidence: number; // 0-1 confidence in current difficulty placement
}

export function createInitialState(): AdaptiveState {
  return {
    currentDifficulty: 'medium',
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    totalCorrect: 0,
    totalIncorrect: 0,
    totalQuestions: 0,
    totalResponseTimeMs: 0,
    topicStats: {},
    weightedScore: 0,
    maxWeightedScore: 0,
    confidence: 0.5,
  };
}

export function processAnswer(
  state: AdaptiveState,
  isCorrect: boolean,
  responseTimeMs: number,
  difficulty: Difficulty,
  topic: string
): AdaptiveState {
  const newState = { ...state };
  newState.totalQuestions += 1;
  newState.totalResponseTimeMs += responseTimeMs;

  // Weighted scoring
  const weight = DIFFICULTY_WEIGHT[difficulty];
  newState.maxWeightedScore += weight;
  if (isCorrect) {
    newState.weightedScore += weight;
  }

  // Topic stats
  if (!newState.topicStats[topic]) {
    newState.topicStats[topic] = { correct: 0, total: 0 };
  }
  newState.topicStats[topic] = {
    correct: newState.topicStats[topic].correct + (isCorrect ? 1 : 0),
    total: newState.topicStats[topic].total + 1,
  };

  if (isCorrect) {
    newState.totalCorrect += 1;
    newState.consecutiveCorrect += 1;
    newState.consecutiveIncorrect = 0;
  } else {
    newState.totalIncorrect += 1;
    newState.consecutiveIncorrect += 1;
    newState.consecutiveCorrect = 0;
  }

  // Time-based confidence adjustment
  // Fast correct answers increase confidence, slow correct or incorrect decrease it
  const avgTime = newState.totalResponseTimeMs / newState.totalQuestions;
  const timeFactor = responseTimeMs < avgTime * 0.7 ? 1.1 : responseTimeMs > avgTime * 1.5 ? 0.9 : 1.0;

  // Confidence-based difficulty adjustment
  if (isCorrect) {
    newState.confidence = Math.min(1, newState.confidence * timeFactor + 0.05);
  } else {
    newState.confidence = Math.max(0, newState.confidence * timeFactor - 0.08);
  }

  // Adaptive difficulty change
  const idx = DIFFICULTY_ORDER.indexOf(newState.currentDifficulty);

  if (newState.consecutiveCorrect >= 2 && newState.confidence > 0.55) {
    // Move up
    if (idx < DIFFICULTY_ORDER.length - 1) {
      newState.currentDifficulty = DIFFICULTY_ORDER[idx + 1];
      newState.consecutiveCorrect = 0;
      newState.confidence = 0.5; // Reset confidence at new level
    }
  } else if (newState.consecutiveIncorrect >= 2 && newState.confidence < 0.45) {
    // Move down
    if (idx > 0) {
      newState.currentDifficulty = DIFFICULTY_ORDER[idx - 1];
      newState.consecutiveIncorrect = 0;
      newState.confidence = 0.5;
    }
  }

  return newState;
}

export function getAccuracy(state: AdaptiveState): number {
  if (state.totalQuestions === 0) return 0;
  return Math.round((state.totalCorrect / state.totalQuestions) * 100);
}

export function getWeightedAccuracy(state: AdaptiveState): number {
  if (state.maxWeightedScore === 0) return 0;
  return Math.round((state.weightedScore / state.maxWeightedScore) * 100);
}

export function getAvgResponseTime(state: AdaptiveState): number {
  if (state.totalQuestions === 0) return 0;
  return Math.round(state.totalResponseTimeMs / state.totalQuestions);
}

export function getMasteryLevel(state: AdaptiveState): string {
  const wa = getWeightedAccuracy(state);
  if (wa >= 80) return 'Advanced';
  if (wa >= 50) return 'Intermediate';
  return 'Beginner';
}

export interface TopicAnalysis {
  topic: string;
  accuracy: number;
  correct: number;
  total: number;
  category: 'strength' | 'moderate' | 'weak';
}

export function analyzeTopics(state: AdaptiveState): TopicAnalysis[] {
  return Object.entries(state.topicStats).map(([topic, stats]) => {
    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    let category: 'strength' | 'moderate' | 'weak';
    if (accuracy > 75) category = 'strength';
    else if (accuracy >= 50) category = 'moderate';
    else category = 'weak';
    return { topic, accuracy, correct: stats.correct, total: stats.total, category };
  });
}

export function getRecommendations(topics: TopicAnalysis[]): string[] {
  const weak = topics.filter(t => t.category === 'weak');
  const moderate = topics.filter(t => t.category === 'moderate');
  const recs: string[] = [];

  if (weak.length > 0) {
    weak.forEach(t => recs.push(`Focus on ${t.topic} — your accuracy is ${t.accuracy}%. Practice foundational concepts.`));
  }
  if (moderate.length > 0) {
    moderate.forEach(t => recs.push(`Strengthen ${t.topic} (${t.accuracy}%) with more challenging problems.`));
  }
  if (recs.length === 0) {
    recs.push('Excellent performance across all topics! Try harder difficulty levels.');
  }
  return recs;
}
