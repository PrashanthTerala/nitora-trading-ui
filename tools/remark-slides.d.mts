// Types for tools/remark-slides.mjs, so vite.config.ts can import it under strict TypeScript.
export interface DeckSlide {
  kind: 'title' | 'intro' | 'section' | 'table' | 'figure' | 'callout' | 'widget' | 'summary' | 'question' | 'closing' | 'manual';
  title: string;
  part?: number;
  parts?: number;
  nodes: unknown[];
}
export interface BuiltDeck {
  mode: 'auto' | 'manual';
  slides: DeckSlide[];
}
export declare const WORDS_PER_SLIDE: number;
export declare function textOf(node: unknown): string;
export declare function wordsOf(node: unknown): number;
export declare function buildDeck(root: unknown): BuiltDeck;
export declare function outlineOf(deck: BuiltDeck): { mode: string; count: number; outline: { kind: string; title: string; part?: number; parts?: number }[] };
export default function remarkSlides(options?: { onDeck?: (deck: BuiltDeck, file: unknown) => void }): (root: unknown, file: unknown) => void;
