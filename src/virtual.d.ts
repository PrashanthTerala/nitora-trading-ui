/** See lessonExcerpt() in vite.config.ts. */
declare module 'virtual:lesson-excerpt' {
  const excerpt: {
    moduleId: string;
    lessonId: string;
    figure: { name: string; caption: string };
    eli5: string;
    question: { q: string; options: string[]; answer: number; explain?: string };
    questionCount: number;
  };
  export default excerpt;
}

/** See contentIndex() in vite.config.ts. Values are lesson paths, in curriculum order. */
declare module 'virtual:content-index' {
  const index: {
    patterns: Record<string, string[]>;
    terms: Record<string, string[]>;
  };
  export default index;
}
