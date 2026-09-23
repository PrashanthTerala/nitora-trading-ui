import { useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { MDXProvider } from '@mdx-js/react';
import { CheckCircle2, ChevronRight, Clock } from 'lucide-react';
import { findLesson, findModule, LEVELS } from '@/content/curriculum';
import { mdxComponents } from '@/components/mdx';
import { useProgress, lessonKey } from '@/store/progress';
import { LessonBodySkeleton } from '@/components/layout/PageSkeletons';
import { RouteFallback } from '@/components/layout/RouteProgress';
import { LessonOutline } from '@/components/lesson/LessonOutline';
import { OnThisPage, ReadingProgressBar, useLessonScroll } from '@/components/lesson/OnThisPage';
import { LessonFooter } from '@/components/lesson/LessonFooter';
import { useLessonKeys } from '@/components/lesson/useLessonKeys';
import { LevelBadge } from '@/components/curriculum/ModuleCover';
import { Chip } from '@/components/ui/Chip';
import { toast } from '@/components/ui/Toast';
import { usePageMeta, publisher, isoMinutes } from '@/lib/pageMeta';
import { t } from '@/i18n';

const lessonModules = import.meta.glob('../content/modules/*/*.mdx') as Record<string, () => Promise<{ default: ComponentType }>>;

function loaderFor(moduleId: string, lessonId: string) {
  return lessonModules[`../content/modules/${moduleId}/${lessonId}.mdx`];
}

/**
 * A lesson, in read mode. Three columns on wide screens -- the module's lessons, the article at
 * a 68ch measure, and an on-this-page list with reading progress -- collapsing to one column,
 * with the outline as a disclosure and progress as a line under the header.
 */
export default function LessonPage() {
  const { moduleId = '', lessonId = '' } = useParams();
  const found = findLesson(moduleId, lessonId);
  const mod = findModule(moduleId);
  const navigate = useNavigate();
  const { hash } = useLocation();
  const key = lessonKey(moduleId, lessonId);
  const done = useProgress((s) => !!s.completed[key]);
  const quiz = useProgress((s) => s.quizScores[key]);
  const markComplete = useProgress((s) => s.markComplete);
  const unmarkComplete = useProgress((s) => s.unmarkComplete);
  const setLastVisited = useProgress((s) => s.setLastVisited);
  const [Content, setContent] = useState<ComponentType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const articleRef = useRef<HTMLElement>(null);
  const { items, active, progress } = useLessonScroll(articleRef, Content);

  useEffect(() => {
    setContent(null);
    setError(null);
    const loader = loaderFor(moduleId, lessonId);
    if (!loader) {
      setError('missing');
      return;
    }
    let alive = true;
    loader()
      .then((m) => alive && setContent(() => m.default))
      .catch((e) => alive && setError(String(e)));
    setLastVisited(key);
    return () => {
      alive = false;
    };
  }, [moduleId, lessonId, key, setLastVisited]);

  // A link to a heading or figure (#fig-...) can only land once the lesson's MDX has rendered.
  useEffect(() => {
    if (!Content || !hash) return;
    const id = decodeURIComponent(hash.slice(1));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView());
  }, [Content, hash]);

  const toggleDone = useCallback(() => {
    if (done) {
      unmarkComplete(key);
      toast({ title: t('toast.lessonUndone') });
    } else {
      markComplete(key);
      toast({ title: t('toast.lessonComplete'), tone: 'up' });
    }
  }, [done, key, markComplete, unmarkComplete]);

  const prevPath = found?.prev?.path;
  const nextPath = found?.next?.path;
  useLessonKeys({
    prev: prevPath ? () => navigate(prevPath) : undefined,
    next: nextPath
      ? () => {
          if (!done) markComplete(key);
          navigate(nextPath);
        }
      : undefined,
    toggleDone,
  });

  usePageMeta(
    found && mod
      ? {
          title: found.lesson.title,
          description: found.lesson.summary,
          image: mod.art?.dark,
          jsonLd: {
            '@type': 'LearningResource',
            name: found.lesson.title,
            description: found.lesson.summary,
            learningResourceType: 'Lesson',
            educationalLevel: LEVELS[mod.level].label,
            timeRequired: isoMinutes(found.lesson.minutes),
            inLanguage: 'en',
            isAccessibleForFree: true,
            url: `${location.origin}${found.lesson.path}`,
            isPartOf: { '@type': 'Course', name: mod.title, url: `${location.origin}/learn/${mod.id}` },
            publisher: publisher(),
          },
        }
      : {},
  );

  if (!found || !mod) return <Navigate to="/learn" replace />;
  const { lesson, prev, next } = found;

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
      <ReadingProgressBar progress={progress} />
      <div className="lg:grid lg:grid-cols-[232px_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[232px_minmax(0,1fr)_208px] xl:gap-12">
        <aside className="mb-6 lg:mb-0">
          <LessonOutline module={mod} currentId={lesson.id} />
        </aside>

        <article ref={articleRef} className="mx-auto w-full min-w-0 max-w-(--container-lesson)">
          <header className="mb-10">
            <nav aria-label={t('lesson.breadcrumb')}>
              <ol className="flex flex-wrap items-center gap-1 text-body-sm text-ink-muted">
                <li>
                  <Link to="/learn" className="hover:text-ink">
                    {t('nav.learn')}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight size={14} strokeWidth={1.5} />
                </li>
                <li className="min-w-0">
                  <Link to={`/learn/${mod.id}`} className="hover:text-ink">
                    {t('common.module', { number: mod.number })}: {mod.title}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronRight size={14} strokeWidth={1.5} />
                </li>
                <li aria-current="page" className="text-ink-soft">
                  {t('lesson.lessonOf', { number: lesson.index + 1, total: mod.lessons.length })}
                </li>
              </ol>
            </nav>
            <div className="mt-6">
              <LevelBadge level={mod.level} />
            </div>
            <h1 className="mt-2 font-display text-h1 font-bold text-ink">{lesson.title}</h1>
            <p className="mt-3 text-body-lg text-ink-soft">{lesson.summary}</p>
            <div className="mt-5 flex flex-wrap items-center gap-2 border-b border-line pb-6 text-body-sm text-ink-soft">
              <span className="mr-2 flex items-center gap-1.5">
                <Clock size={14} strokeWidth={1.5} aria-hidden /> {t('lesson.minutes', { count: lesson.minutes })}
              </span>
              {quiz && (
                <Chip tone={quiz.score === quiz.total ? 'up' : 'accent'} size="md">
                  {t('common.quizBest', { score: quiz.score, total: quiz.total })}
                </Chip>
              )}
              {done && (
                <Chip tone="up" size="md">
                  <CheckCircle2 size={13} strokeWidth={2} aria-hidden /> {t('common.completed')}
                </Chip>
              )}
            </div>
          </header>

          <div className="prose-lesson">
            {error === 'missing' && <div className="not-prose rounded-card border-l-[3px] border-warn bg-warn-soft p-5 text-body-sm text-ink">{t('lesson.missing')}</div>}
            {error && error !== 'missing' && (
              <div role="alert" className="not-prose rounded-card border-l-[3px] border-danger bg-danger-soft p-5 text-body-sm text-ink">
                {t('lesson.failed', { error })}
              </div>
            )}
            {!error && !Content && (
              <RouteFallback label={t('loading.lesson')}>
                <LessonBodySkeleton />
              </RouteFallback>
            )}
            {Content && (
              <MDXProvider components={mdxComponents}>
                <Content />
              </MDXProvider>
            )}
          </div>

          <LessonFooter lesson={lesson} prev={prev} next={next} done={done} onToggleDone={toggleDone} />
        </article>

        <aside className="hidden xl:block">
          <OnThisPage items={items} active={active} progress={progress} />
        </aside>
      </div>
    </div>
  );
}
