import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Shell } from '@/components/layout/Shell';
import { HomePage } from '@/pages/HomePage';
import { LearnPage } from '@/pages/LearnPage';
import { ModulePage } from '@/pages/ModulePage';
import { LessonPage } from '@/pages/LessonPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const SimulatorPage = lazy(() => import('@/pages/SimulatorPage').then((m) => ({ default: m.SimulatorPage })));
const TrainerPage = lazy(() => import('@/pages/TrainerPage').then((m) => ({ default: m.TrainerPage })));
const JournalPage = lazy(() => import('@/pages/JournalPage').then((m) => ({ default: m.JournalPage })));
// The glossary carries 258 entries of prose; keep it out of the initial bundle.
const GlossaryPage = lazy(() => import('@/pages/GlossaryPage').then((m) => ({ default: m.GlossaryPage })));
const GuidePage = lazy(() => import('@/pages/GuidePage').then((m) => ({ default: m.GuidePage })));
// The design-token sheet, for review during development. `import.meta.env.DEV` is replaced
// with false in a production build, so the page and its import are dropped from the bundle.
const TokensPage = import.meta.env.DEV ? lazy(() => import('@/pages/TokensPage').then((m) => ({ default: m.TokensPage }))) : null;

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function Loading() {
  return (
    <div className="flex h-64 items-center justify-center text-sm text-ink-soft">
      <span className="live-dot mr-2 inline-block h-2 w-2 rounded-full bg-accent" /> Loading…
    </div>
  );
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<HomePage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="learn/:moduleId" element={<ModulePage />} />
          <Route path="learn/:moduleId/:lessonId" element={<LessonPage />} />
          <Route path="glossary" element={<Suspense fallback={<Loading />}><GlossaryPage /></Suspense>} />
          <Route path="guide" element={<Suspense fallback={<Loading />}><GuidePage /></Suspense>} />
          <Route
            path="simulator"
            element={
              <Suspense fallback={<Loading />}>
                <SimulatorPage />
              </Suspense>
            }
          />
          <Route
            path="trainer"
            element={
              <Suspense fallback={<Loading />}>
                <TrainerPage />
              </Suspense>
            }
          />
          <Route
            path="journal"
            element={
              <Suspense fallback={<Loading />}>
                <JournalPage />
              </Suspense>
            }
          />
          {TokensPage && (
            <Route
              path="__tokens"
              element={
                <Suspense fallback={<Loading />}>
                  <TokensPage />
                </Suspense>
              }
            />
          )}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
