import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { LazyMotion, MotionConfig } from 'motion/react';
import { Shell } from '@/components/layout/Shell';
import { RouteFallback } from '@/components/layout/RouteProgress';
import { DocSkeleton, GlossarySkeleton, JournalSkeleton, SimulatorSkeleton, TrainerSkeleton } from '@/components/layout/PageSkeletons';
import { HomePage } from '@/pages/HomePage';
import { LearnPage } from '@/pages/LearnPage';
import { ModulePage } from '@/pages/ModulePage';
import { TrackPage } from '@/pages/TrackPage';
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

// Motion's animation features arrive after first paint; see lib/motionFeatures.
const loadMotionFeatures = () => import('@/lib/motionFeatures').then((mod) => mod.default);

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

function Lazy({ skeleton, children }: { skeleton: ReactNode; children: ReactNode }) {
  return <Suspense fallback={<RouteFallback>{skeleton}</RouteFallback>}>{children}</Suspense>;
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={loadMotionFeatures} strict>
        <ScrollToTop />
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<HomePage />} />
            <Route path="learn" element={<LearnPage />} />
            <Route path="learn/t/:trackId" element={<TrackPage />} />
            <Route path="learn/:moduleId" element={<ModulePage />} />
            <Route path="learn/:moduleId/:lessonId" element={<LessonPage />} />
            <Route path="glossary" element={<Lazy skeleton={<GlossarySkeleton />}><GlossaryPage /></Lazy>} />
            <Route path="guide" element={<Lazy skeleton={<DocSkeleton />}><GuidePage /></Lazy>} />
            <Route path="simulator" element={<Lazy skeleton={<SimulatorSkeleton />}><SimulatorPage /></Lazy>} />
            <Route path="trainer" element={<Lazy skeleton={<TrainerSkeleton />}><TrainerPage /></Lazy>} />
            <Route path="journal" element={<Lazy skeleton={<JournalSkeleton />}><JournalPage /></Lazy>} />
            {TokensPage && <Route path="__tokens" element={<Lazy skeleton={<DocSkeleton />}><TokensPage /></Lazy>} />}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </LazyMotion>
    </MotionConfig>
  );
}
