import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ALL_LESSONS, CURRICULUM } from '@/content/curriculum';

export const lessonKey = (moduleId: string, lessonId: string) => `${moduleId}/${lessonId}`;

interface ProgressState {
  completed: Record<string, number>; // key -> timestamp
  quizScores: Record<string, { score: number; total: number; at: number }>;
  lastVisited: string | null;
  trainerBest: Record<string, number>;
  markComplete: (key: string) => void;
  unmarkComplete: (key: string) => void;
  recordQuiz: (key: string, score: number, total: number) => void;
  setLastVisited: (key: string) => void;
  setTrainerBest: (game: string, score: number) => void;
  resetAll: () => void;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      completed: {},
      quizScores: {},
      lastVisited: null,
      trainerBest: {},
      markComplete: (key) => set((s) => ({ completed: { ...s.completed, [key]: Date.now() } })),
      unmarkComplete: (key) =>
        set((s) => {
          const next = { ...s.completed };
          delete next[key];
          return { completed: next };
        }),
      recordQuiz: (key, score, total) =>
        set((s) => {
          const prev = s.quizScores[key];
          if (prev && prev.score >= score) return {};
          return { quizScores: { ...s.quizScores, [key]: { score, total, at: Date.now() } } };
        }),
      setLastVisited: (key) => set({ lastVisited: key }),
      setTrainerBest: (game, score) =>
        set((s) => (score > (s.trainerBest[game] ?? 0) ? { trainerBest: { ...s.trainerBest, [game]: score } } : {})),
      resetAll: () => set({ completed: {}, quizScores: {}, lastVisited: null, trainerBest: {} }),
    }),
    { name: 'tradelab-progress-v1' },
  ),
);

export function moduleProgress(completed: Record<string, number>, moduleId: string) {
  const mod = CURRICULUM.find((m) => m.id === moduleId);
  if (!mod) return { done: 0, total: 0, pct: 0 };
  const done = mod.lessons.filter((l) => completed[lessonKey(moduleId, l.id)]).length;
  return { done, total: mod.lessons.length, pct: mod.lessons.length ? Math.round((done / mod.lessons.length) * 100) : 0 };
}

export function overallProgress(completed: Record<string, number>) {
  const done = ALL_LESSONS.filter((l) => completed[lessonKey(l.moduleId, l.id)]).length;
  return { done, total: ALL_LESSONS.length, pct: Math.round((done / ALL_LESSONS.length) * 100) };
}

/** The first lesson that is not yet completed, in curriculum order. */
export function nextLesson(completed: Record<string, number>) {
  return ALL_LESSONS.find((l) => !completed[lessonKey(l.moduleId, l.id)]) ?? null;
}
