import { Children, isValidElement, useContext, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { ArrowRight, BookOpen, Check, CheckCircle2, Circle, Clock, ListChecks, X } from 'lucide-react';
import { LevelBadge } from '@/components/curriculum/ModuleCover';
import { Button, buttonClass } from '@/components/ui/Button';
import { cx } from '@/components/ui/cx';
import type { QuizQuestion } from '@/components/mdx/Quiz';
import { t } from '@/i18n';
import { DeckContext, SlideContext, useDeckHost, type SlideKind } from './context';

/** "(2/3)" after a split section's title. */
const partSuffix = (part?: number, parts?: number) => (part && parts && parts > 1 ? ` ${t('deck.part', { part, parts })}` : '');

function SlideTitle({ children, small = false }: { children: ReactNode; small?: boolean }) {
  return small ? (
    <p className="mb-5 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{children}</p>
  ) : (
    <h2 className="mb-6 font-display text-[clamp(1.75rem,1.1rem+2vw,3rem)] font-semibold leading-tight text-ink">{children}</h2>
  );
}

/** Slide body text: the lesson's own prose styles, a size up. */
function Prose({ children }: { children: ReactNode }) {
  return <div className="prose-lesson deck-prose">{children}</div>;
}

/**
 * One slide. The build writes `<Slide kind=... index=... title=... part=... parts=...>` around
 * each slide's content; hand-made decks write `<Slide title="...">`. Attributes arrive as
 * strings, because that is how the build writes them.
 */
export function Slide({ kind = 'manual', index = '0', title, part, parts, children }: { kind?: SlideKind; index?: string; title?: string; part?: string; parts?: string; children?: ReactNode }) {
  const host = useDeckHost();
  const info = { kind, index: Number(index), title, part: part ? Number(part) : undefined, parts: parts ? Number(parts) : undefined };
  const suffix = partSuffix(info.part, info.parts);

  let body: ReactNode;
  switch (kind) {
    case 'title':
      body = (
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <LevelBadge level={host.module.level} />
            <span className="text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">
              {t('common.module', { number: host.module.number })} · {host.module.title}
            </span>
          </div>
          <h1 className="font-display text-[clamp(2.25rem,1.3rem+3.2vw,4.25rem)] font-bold leading-[1.05] text-ink">{host.lesson.title}</h1>
          <p className="mt-4 max-w-3xl text-[clamp(1.125rem,0.95rem+0.6vw,1.5rem)] text-ink-soft">{host.lesson.summary}</p>
          {Children.count(children) > 0 && (
            <div className="mt-8 max-w-3xl border-t border-line pt-6">
              <Prose>{children}</Prose>
            </div>
          )}
          <p className="mt-6 flex items-center gap-2 text-body-sm text-ink-muted">
            <Clock size={14} strokeWidth={1.5} aria-hidden /> {t('lesson.minutes', { count: host.lesson.minutes })}
          </p>
        </div>
      );
      break;
    case 'intro':
      body = (
        <>
          <SlideTitle>{host.lesson.title + suffix}</SlideTitle>
          <Prose>{children}</Prose>
        </>
      );
      break;
    case 'section':
    case 'table':
    case 'manual':
      body = (
        <>
          {title && <SlideTitle>{title + suffix}</SlideTitle>}
          <Prose>{children}</Prose>
        </>
      );
      break;
    case 'figure':
      body = (
        <>
          {title && <SlideTitle small>{title}</SlideTitle>}
          <SlideFigure>{children}</SlideFigure>
        </>
      );
      break;
    case 'callout':
    case 'widget':
      body = (
        <>
          {title && <SlideTitle small>{title}</SlideTitle>}
          <div className="deck-zoom">{children}</div>
        </>
      );
      break;
    case 'summary':
    case 'question':
      body = children;
      break;
    case 'closing':
      body = <DeckClosing />;
      break;
  }

  return (
    <SlideContext.Provider value={info}>
      <div className="mx-auto w-full max-w-[min(68rem,100%)]" data-slide-kind={kind}>
        {body}
      </div>
    </SlideContext.Provider>
  );
}

/** A figure given the whole slide. Also usable in a hand-made deck around any figure. */
export function SlideFigure({ children }: { children?: ReactNode }) {
  return <div className="deck-figure">{children}</div>;
}

/** Speaker notes: shown under the slide when notes are switched on (the N key). */
export function SlideNotes({ children }: { children?: ReactNode }) {
  const host = useDeckHost();
  if (!host.showNotes) return null;
  return (
    <aside className="mt-8 rounded-card border border-dashed border-line-strong bg-surface-1 p-4 text-body-sm text-ink-soft">
      <p className="mb-1 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('deck.notes')}</p>
      <div className="md">{children}</div>
    </aside>
  );
}

/** True when a slide element holds speaker notes, for the notes button. */
export function hasNotes(slide: ReactNode): boolean {
  if (!isValidElement<{ children?: ReactNode }>(slide)) return false;
  return Children.toArray(slide.props.children).some((c) => isValidElement(c) && c.type === SlideNotes);
}

/** The summary slide: the takeaways, each point rising in turn. */
export function DeckTakeaways({ children }: { children?: ReactNode }) {
  return (
    <div>
      <h2 className="mb-8 flex items-center gap-3 font-display text-[clamp(1.75rem,1.1rem+2vw,3rem)] font-semibold text-ink">
        <ListChecks size={32} strokeWidth={1.5} className="text-accent" aria-hidden /> {t('mdx.takeaways')}
      </h2>
      <div className="takeaways deck-stagger deck-prose md text-ink">{children}</div>
    </div>
  );
}

/** One quiz question per slide. Answering reveals the right option and the explanation. */
export function DeckQuestion({ questions }: { questions: QuizQuestion[] }) {
  const slide = useContext(SlideContext);
  const { printing } = useContext(DeckContext);
  const host = useDeckHost();
  const qi = (slide?.part ?? 1) - 1;
  const q = questions[qi];
  if (!q) return null;
  const chosen = host.answers[qi]?.option;
  const answered = chosen !== undefined && !printing;
  return (
    <div>
      <p className="mb-4 text-caption font-semibold uppercase tracking-[0.08em] text-accent">{t('deck.question', { part: qi + 1, parts: questions.length })}</p>
      <h2 className="mb-8 font-display text-[clamp(1.5rem,1rem+1.6vw,2.5rem)] font-semibold leading-snug text-ink">{q.q}</h2>
      <div role="group" aria-label={q.q} className="grid gap-3 md:grid-cols-2">
        {q.options.map((opt, oi) => {
          const state = !answered ? 'idle' : oi === q.answer ? 'correct' : oi === chosen ? 'wrong' : 'idle';
          return (
            <m.button
              key={oi}
              type="button"
              disabled={answered || printing}
              aria-pressed={chosen === oi}
              onClick={() => host.setAnswer(qi, oi, oi === q.answer)}
              animate={state === 'wrong' ? { x: [0, -6, 6, -3, 3, 0] } : state === 'correct' && chosen === oi ? { scale: [1, 1.03, 1] } : undefined}
              transition={{ duration: 0.36 }}
              className={cx(
                'flex items-center gap-4 rounded-card border px-5 py-4 text-left text-[clamp(1rem,0.9rem+0.35vw,1.25rem)] transition-colors duration-(--duration-fast) disabled:cursor-default',
                state === 'idle' && 'border-line bg-surface-1 text-ink enabled:hover:border-line-strong enabled:hover:bg-surface-2',
                state === 'correct' && 'border-up bg-up-soft text-ink',
                state === 'wrong' && 'border-down bg-down-soft text-ink',
                answered && state === 'idle' && 'opacity-60',
              )}
            >
              <span
                aria-hidden
                className={cx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-mono font-semibold',
                  state === 'correct' ? 'border-up bg-up text-on-up' : state === 'wrong' ? 'border-down bg-down text-on-down' : 'border-line-strong text-ink-soft',
                )}
              >
                {state === 'correct' ? <Check size={16} strokeWidth={3} /> : state === 'wrong' ? <X size={16} strokeWidth={3} /> : String.fromCharCode(65 + oi)}
              </span>
              <span className="flex-1">{opt}</span>
            </m.button>
          );
        })}
      </div>
      <div aria-live="polite">
        {answered && (
          <m.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-6 max-w-3xl text-[clamp(1rem,0.9rem+0.35vw,1.25rem)] text-ink-soft">
            <strong className={chosen === q.answer ? 'text-up' : 'text-down'}>{chosen === q.answer ? t('deck.correct') : t('deck.wrong')}</strong> {q.explain}
          </m.p>
        )}
      </div>
    </div>
  );
}

/** The last slide: how the quiz went, mark the lesson complete, move on. */
function DeckClosing() {
  const host = useDeckHost();
  const { printing } = useContext(DeckContext);
  const total = Object.keys(host.answers).length;
  return (
    <div className="text-center">
      <p className="text-caption font-semibold uppercase tracking-[0.08em] text-accent">{t('deck.end')}</p>
      <h2 className="mx-auto mt-3 max-w-3xl font-display text-[clamp(2rem,1.2rem+2.5vw,3.5rem)] font-bold leading-tight text-ink">{host.lesson.title}</h2>
      {total > 0 && <DeckScore />}
      {!printing && (
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button variant={host.done ? 'secondary' : 'primary'} size="lg" onClick={host.onToggleDone} aria-pressed={host.done}>
            {host.done ? <CheckCircle2 size={18} strokeWidth={1.75} className="text-up" aria-hidden /> : <Circle size={18} strokeWidth={1.75} aria-hidden />}
            {host.done ? t('lesson.completedUndo') : t('lesson.markComplete')}
          </Button>
          {host.next ? (
            <Link to={host.next.path} className={buttonClass({ variant: host.done ? 'primary' : 'secondary', size: 'lg' })}>
              {t('deck.nextLesson', { title: host.next.title })} <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
            </Link>
          ) : (
            <Link to="/simulator" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
              {t('lesson.finishedCta')} <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
            </Link>
          )}
          <Button variant="ghost" size="lg" onClick={host.onExit}>
            <BookOpen size={18} strokeWidth={1.5} aria-hidden /> {t('deck.exit')}
          </Button>
        </div>
      )}
    </div>
  );
}

function DeckScore() {
  const host = useDeckHost();
  const given = Object.values(host.answers);
  const correct = given.filter((a) => a.correct).length;
  return (
    <p className="mt-4 text-body-lg text-ink-soft">
      {given.length === host.questionCount
        ? t('mdx.quiz.result', { score: correct, total: host.questionCount })
        : t('deck.answered', { answered: given.length, total: host.questionCount, score: correct })}
    </p>
  );
}
