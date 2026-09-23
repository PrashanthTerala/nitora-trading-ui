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
