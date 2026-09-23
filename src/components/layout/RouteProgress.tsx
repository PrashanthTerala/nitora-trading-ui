import { useEffect, useState, type ReactNode } from 'react';
import { create } from 'zustand';
import { t } from '@/i18n';

/**
 * A 2 px accent bar across the top while a lazy route or lesson loads.
 *
 * Every loading fallback registers itself while mounted; the bar shows while any is. It waits
 * 120 ms before appearing, so a chunk that arrives quickly never flashes a bar at all.
 */
const useLoading = create<{ count: number; begin: () => void; end: () => void }>((set) => ({
  count: 0,
  begin: () => set((s) => ({ count: s.count + 1 })),
  end: () => set((s) => ({ count: Math.max(0, s.count - 1) })),
}));

/** Use as a Suspense fallback: shows the page's skeleton and drives the progress bar. */
export function RouteFallback({ children, label = t('loading.page') }: { children: ReactNode; label?: string }) {
  const begin = useLoading((s) => s.begin);
  const end = useLoading((s) => s.end);
  useEffect(() => {
    begin();
    return end;
  }, [begin, end]);
  return (
    <div aria-busy="true" aria-label={label} role="status">
      {children}
    </div>
  );
}

export function RouteProgressBar() {
  const loading = useLoading((s) => s.count > 0);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!loading) {
      setVisible(false);
      return;
    }
    const id = window.setTimeout(() => setVisible(true), 120);
    return () => window.clearTimeout(id);
  }, [loading]);
  if (!visible) return null;
  return (
    <div aria-hidden className="fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden">
      <div className="h-full w-2/5 bg-accent motion-safe:animate-[route-progress_1.1s_var(--ease-standard)_infinite] motion-reduce:w-full motion-reduce:opacity-60" />
    </div>
  );
}
