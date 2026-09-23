import { useEffect, useLayoutEffect, useRef } from 'react';

/**
 * Lesson shortcuts: ← and → move to the previous and next lesson, M marks the lesson complete
 * (or not). They stand aside whenever a key belongs to something else: typing in a field, a
 * control that uses arrows itself (segmented switches, tabs), an open dialog, or any modifier.
 */
export function useLessonKeys(handlers: { prev?: () => void; next?: () => void; toggleDone: () => void }) {
  // The latest handlers, without re-binding the listener on every render.
  const ref = useRef(handlers);
  useLayoutEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"], [role="radiogroup"], [role="tablist"], [role="slider"], [role="dialog"]')) return;
      if (document.querySelector('[role="dialog"]')) return;
      const h = ref.current;
      if (e.key === 'ArrowLeft' && h.prev) h.prev();
      else if (e.key === 'ArrowRight' && h.next) h.next();
      else if (e.key === 'm' || e.key === 'M') h.toggleDone();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
