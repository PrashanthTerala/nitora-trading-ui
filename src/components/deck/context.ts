import { createContext, useContext } from 'react';
import type { FlatLesson, ModuleMeta } from '@/content/curriculum';

/** The `slides` export remark-slides adds to every lesson module: the deck's shape. */
export interface DeckMeta {
  mode: 'auto' | 'manual';
  count: number;
  outline: { kind: SlideKind; title: string; part?: number; parts?: number }[];
}

export type SlideKind = 'title' | 'intro' | 'section' | 'table' | 'figure' | 'callout' | 'widget' | 'summary' | 'question' | 'closing' | 'manual';

/** True inside the presentation view, so shared components (figures) can present themselves. */
export const DeckContext = createContext<{ inDeck: boolean; printing: boolean }>({ inDeck: false, printing: false });
export const useDeck = () => useContext(DeckContext);

/** The slide being rendered, for components whose content depends on it (one quiz question). */
export interface SlideInfo {
  kind: SlideKind;
  index: number;
  title?: string;
  part?: number;
  parts?: number;
}
export const SlideContext = createContext<SlideInfo | null>(null);

/** What the lesson page hands the deck: the lesson, and what the closing slide can do. */
export interface DeckHost {
  lesson: FlatLesson;
  module: ModuleMeta;
  next: FlatLesson | null;
  done: boolean;
  onToggleDone: () => void;
  onExit: () => void;
  /** Quiz answers given in the deck, by question index. */
  answers: Record<number, { option: number; correct: boolean }>;
  setAnswer: (question: number, option: number, correct: boolean) => void;
  /** How many question slides the deck has. */
  questionCount: number;
  showNotes: boolean;
}
export const DeckHostContext = createContext<DeckHost | null>(null);

export function useDeckHost(): DeckHost {
  const host = useContext(DeckHostContext);
  if (!host) throw new Error('useDeckHost outside the presentation view');
  return host;
}
