'use client';

import { readLocalStorageJson, writeLocalStorageJson } from '@/lib/storage/safe-local-storage';

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  passed: boolean;
  attemptedAt: string;
}

const QUIZ_ATTEMPTS_KEY = 'b3-quiz-attempts';

export function getQuizAttempts(userId: string, quizId?: string): QuizAttempt[] {
  const all = readLocalStorageJson<QuizAttempt[]>(QUIZ_ATTEMPTS_KEY, []);
  const userAttempts = all.filter((attempt) => attempt.userId === userId);
  return quizId ? userAttempts.filter((attempt) => attempt.quizId === quizId) : userAttempts;
}

export function saveQuizAttempt(input: {
  userId: string;
  quizId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  passed: boolean;
}) {
  const attempt: QuizAttempt = {
    id: `attempt-${Date.now()}`,
    ...input,
    attemptedAt: new Date().toISOString(),
  };

  const all = readLocalStorageJson<QuizAttempt[]>(QUIZ_ATTEMPTS_KEY, []);
  writeLocalStorageJson(QUIZ_ATTEMPTS_KEY, [attempt, ...all]);
  return attempt;
}
