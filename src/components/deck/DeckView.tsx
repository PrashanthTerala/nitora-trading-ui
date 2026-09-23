/**
 * The presentation view: a lesson as a full-screen slide deck. Loaded only when a reader
 * switches a lesson to Present.
 *
 * The slides are already compiled into the lesson module (see tools/remark-slides.mjs). This
 * renders the lesson's MDX with the deck components swapped in, so everything a slide contains
 * -- figures, glossary terms, callouts -- is the same component the reading page uses.
 */
import { Children, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ComponentType, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { BookOpen, ChevronLeft, ChevronRight, Keyboard, Maximize, Minimize, NotebookText, Printer } from 'lucide-react';
import type { FlatLesson, ModuleMeta } from '@/content/curriculum';
import { mdxComponents } from '@/components/mdx';
import { ModuleCover } from '@/components/curriculum/ModuleCover';
import { Kbd } from '@/components/ui/Kbd';
import { Tooltip } from '@/components/ui/Tooltip';
import { cx } from '@/components/ui/cx';
import { useProgress, lessonKey } from '@/store/progress';
import { t } from '@/i18n';
import { DeckContext, DeckHostContext, type DeckHost, type DeckMeta } from './context';
import { DeckQuestion, DeckTakeaways, Slide, SlideFigure, SlideNotes, hasNotes } from './Slide';

const iconButton =
  'flex h-9 w-9 items-center justify-center rounded-control text-ink-soft transition-colors duration-(--duration-fast) hover:bg-surface-2 hover:text-ink disabled:opacity-40';

/** Anything the reader clicks to operate, as opposed to the slide itself (which advances). */
const INTERACTIVE = 'a, button, input, select, textarea, label, summary, [role="radiogroup"], [role="group"], [role="slider"], figure';

export interface DeckViewProps {
  Content: ComponentType<{ components?: Record<string, unknown> }>;
  meta: DeckMeta;
  lesson: FlatLesson;
  module: ModuleMeta;
  next: FlatLesson | null;
  done: boolean;
  onToggleDone: () => void;
  onExit: () => void;
  initialSlide: number;
  onSlideChange: (index: number) => void;
}

export default function DeckView(props: DeckViewProps) {
  const { Content, meta, lesson } = props;
  const [answers, setAnswers] = useState<DeckHost['answers']>({});
  const [showNotes, setShowNotes] = useState(false);
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const questionCount = meta.outline.filter((s) => s.kind === 'question').length;

  // One answer per question; the first pick stands, as on a real quiz.
  const setAnswer = useCallback((q: number, option: number, correct: boolean) => {
    setAnswers((prev) => (prev[q] ? prev : { ...prev, [q]: { option, correct } }));
  }, []);

  // The deck's quiz counts like the page's: once every question is answered, the attempt is
  // saved (and kept if it is the best). In an effect, not the state update, so the store is
  // never written mid-render.
  const given = Object.values(answers);
  const complete = questionCount > 0 && given.length === questionCount;
  const score = given.filter((a) => a.correct).length;
  useEffect(() => {
    if (complete) recordQuiz(lessonKey(lesson.moduleId, lesson.id), score, questionCount);
  }, [complete, score, questionCount, recordQuiz, lesson.moduleId, lesson.id]);

  const host: DeckHost = {
    lesson,
    module: props.module,
    next: props.next,
    done: props.done,
    onToggleDone: props.onToggleDone,
    onExit: props.onExit,
    answers,
    setAnswer,
    questionCount,
    showNotes,
  };

  const stage = useMemo(() => ({ ...props, showNotes, onToggleNotes: () => setShowNotes((v) => !v) }), [props, showNotes]);

  return (
    <DeckHostContext.Provider value={host}>
      <StageContext.Provider value={stage}>
        <DeckContext.Provider value={{ inDeck: true, printing: false }}>
          <Content components={DECK_COMPONENTS} />
        </DeckContext.Provider>
      </StageContext.Provider>
    </DeckHostContext.Provider>
  );
}

type StageProps = DeckViewProps & { showNotes: boolean; onToggleNotes: () => void };
const StageContext = createContext<StageProps | null>(null);

/** The build's <DeckSource>: its children are the slides. */
function PresentDeckSource({ children }: { children?: ReactNode }) {
  const stage = useContext(StageContext);
  if (!stage) return null;
  return <Stage {...stage} slides={Children.toArray(children)} />;
}

/**
 * The lesson's MDX components, with the deck's own in place of the reading page's. The reading
 * content (LessonBody) renders nothing here, so only the slides are ever mounted.
 */
const DECK_COMPONENTS = {
  ...mdxComponents,
  LessonBody: () => null,
  DeckSource: PresentDeckSource,
  Slide,
  SlideFigure,
  SlideNotes,
  KeyTakeaways: DeckTakeaways,
  Quiz: DeckQuestion,
};

function Stage({
  slides,
  meta,
  lesson,
  module: mod,
  onExit,
  initialSlide,
  onSlideChange,
  showNotes,
  onToggleNotes,
}: StageProps & { slides: ReactNode[] }) {
  const count = slides.length;
  const [index, setIndex] = useState(() => Math.min(Math.max(0, initialSlide), Math.max(0, count - 1)));
  const [direction, setDirection] = useState(1);
  const [help, setHelp] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [printing, setPrinting] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const go = useCallback(
    (to: number) => {
      const target = Math.min(Math.max(0, to), count - 1);
      setIndex((current) => {
        if (target === current) return current;
        setDirection(target > current ? 1 : -1);
        return target;
      });
    },
    [count],
  );

  useEffect(() => onSlideChange(index), [index, onSlideChange]);

  // Focus the deck, lock the page behind it, and give focus back on the way out.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    rootRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void rootRef.current?.requestFullscreen?.();
  }, []);

  const print = useCallback(() => setPrinting(true), []);
  useEffect(() => {
    if (!printing) return;
    const done = () => setPrinting(false);
    window.addEventListener('afterprint', done, { once: true });
    // Two frames: the print-only copy of every slide must be in the document before printing.
    const id = requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener('afterprint', done);
    };
  }, [printing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (help) {
        if (e.key === 'Escape' || e.key === '?') {
          e.preventDefault();
          setHelp(false);
        }
        return;
      }
      const onControl = target?.closest('button, a, [role="radiogroup"]');
      switch (e.key) {
        case 'ArrowRight':
        case 'PageDown':
          go(index + 1);
          break;
        case ' ':
          // Space presses a focused button, as it should; elsewhere it advances.
          if (onControl) return;
          go(index + (e.shiftKey ? -1 : 1));
          break;
        case 'ArrowLeft':
        case 'PageUp':
          go(index - 1);
          break;
        case 'Home':
          go(0);
          break;
        case 'End':
          go(count - 1);
          break;
        case 'Escape':
          if (document.fullscreenElement) return;
          onExit();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'n':
        case 'N':
          onToggleNotes();
          break;
        case 'p':
        case 'P':
          onExit();
          break;
        case '?':
          setHelp(true);
          break;
        default:
          return;
      }
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, index, count, help, onExit, toggleFullscreen, onToggleNotes]);

  // A horizontal swipe on a touch screen moves a slide; a tap is handled as a click below.
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    swiped.current = false;
    swipe.current = e.pointerType === 'touch' ? { x: e.clientX, y: e.clientY } : null;
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const start = swipe.current;
    swipe.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - start.y) * 1.5) {
      swiped.current = true;
      go(dx < 0 ? index + 1 : index - 1);
    }
  };

  // Click the right half of a slide to go on, the left half to go back.
  const onStageClick = (e: MouseEvent<HTMLDivElement>) => {
    if (swiped.current) return;
    if ((e.target as HTMLElement).closest(INTERACTIVE)) return;
    if (window.getSelection()?.toString()) return;
    const rect = e.currentTarget.getBoundingClientRect();
    go(e.clientX - rect.left > rect.width / 2 ? index + 1 : index - 1);
  };

  const slide = slides[index];
  const outline = meta.outline[index];
  const slideLabel = outline?.title || (outline?.kind === 'title' ? lesson.title : outline?.kind === 'summary' ? t('mdx.takeaways') : outline?.kind === 'question' ? t('deck.question', { part: outline.part ?? 1, parts: outline.parts ?? 1 }) : outline?.kind === 'closing' ? t('deck.end') : lesson.title);
  const notesHere = hasNotes(slide);
  const duration = reduce ? 0 : 0.24;

  return (
    <div
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-label={t('deck.label', { title: lesson.title })}
      tabIndex={-1}
      className="deck-root fixed inset-0 z-[55] flex flex-col bg-bg outline-none"
    >
      {/* the module's cover, as a faint wash behind every slide */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.12]">
        <ModuleCover module={mod} variant="thumb" className="h-full w-full" />
      </div>

      <header className="relative flex h-14 shrink-0 items-center gap-2 border-b border-line-subtle bg-bg/80 px-3 sm:px-5">
        <Tooltip content={t('deck.exitKey')}>
          <button type="button" onClick={onExit} className="flex h-9 items-center gap-2 rounded-control px-2.5 text-body-sm font-medium text-ink-soft hover:bg-surface-2 hover:text-ink">
            <BookOpen size={16} strokeWidth={1.5} aria-hidden /> <span className="max-sm:hidden">{t('deck.exit')}</span>
          </button>
        </Tooltip>
        <p className="min-w-0 flex-1 truncate text-center text-body-sm text-ink-muted max-md:hidden">
          {t('common.module', { number: mod.number })} · {lesson.title}
        </p>
        <div className="ml-auto flex items-center gap-0.5">
          {notesHere && (
            <Tooltip content={t('deck.notesKey')} align="end">
              <button type="button" onClick={onToggleNotes} aria-pressed={showNotes} aria-label={t('deck.notes')} className={cx(iconButton, showNotes && 'bg-accent-soft text-accent')}>
                <NotebookText size={17} strokeWidth={1.5} aria-hidden />
              </button>
            </Tooltip>
          )}
          <Tooltip content={t('deck.print')} align="end">
            <button type="button" onClick={print} aria-label={t('deck.print')} className={iconButton}>
              <Printer size={17} strokeWidth={1.5} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip content={t('deck.shortcuts')} align="end">
            <button type="button" onClick={() => setHelp(true)} aria-label={t('deck.shortcuts')} aria-haspopup="dialog" className={cx(iconButton, 'max-sm:hidden')}>
              <Keyboard size={17} strokeWidth={1.5} aria-hidden />
            </button>
          </Tooltip>
          <Tooltip content={fullscreen ? t('deck.exitFullscreen') : t('deck.fullscreen')} align="end">
            <button type="button" onClick={toggleFullscreen} aria-label={fullscreen ? t('deck.exitFullscreen') : t('deck.fullscreen')} className={iconButton}>
              {fullscreen ? <Minimize size={17} strokeWidth={1.5} aria-hidden /> : <Maximize size={17} strokeWidth={1.5} aria-hidden />}
            </button>
          </Tooltip>
          <span className="ml-2 font-mono text-mono-sm text-ink-muted tabular-nums" aria-hidden>
            {index + 1} / {count}
          </span>
        </div>
      </header>

      <div className="relative min-h-0 flex-1 cursor-default touch-pan-y" onClick={onStageClick} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <AnimatePresence initial={false} custom={direction}>
          <m.div
            key={index}
            custom={direction}
            variants={{
              enter: (d: number) => ({ opacity: 0, x: d * 16 }),
              center: { opacity: 1, x: 0 },
              exit: (d: number) => ({ opacity: 0, x: d * -16 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration, ease: [0.2, 0, 0, 1] }}
            className="absolute inset-0 flex overflow-y-auto px-5 py-8 sm:px-10 md:px-16 md:py-12"
          >
            <div className="m-auto w-full">{slide}</div>
          </m.div>
        </AnimatePresence>
      </div>

      <footer className="relative flex h-14 shrink-0 items-center gap-3 border-t border-line-subtle bg-bg/80 px-3 sm:px-5">
        <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label={t('deck.prev')} className={iconButton}>
          <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
        </button>
        <div className="flex min-w-0 flex-1 items-center justify-center gap-1 overflow-hidden" aria-hidden>
          {/* one dot per slide on wider screens; a plain bar where they would not fit */}
          <div className="hidden flex-wrap items-center justify-center gap-1 md:flex">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                tabIndex={-1}
                onClick={() => go(i)}
                className={cx('h-1.5 rounded-full transition-[width,background-color] duration-(--duration-base)', i === index ? 'w-5 bg-accent' : 'w-1.5 bg-line-strong hover:bg-ink-muted')}
              />
            ))}
          </div>
          <div className="h-1 w-full max-w-xs overflow-hidden rounded-full bg-line md:hidden">
            <div className="h-full origin-left bg-accent" style={{ transform: `scaleX(${(index + 1) / count})` }} />
          </div>
        </div>
        <button type="button" onClick={() => go(index + 1)} disabled={index === count - 1} aria-label={t('deck.next')} className={iconButton}>
          <ChevronRight size={20} strokeWidth={1.5} aria-hidden />
        </button>
        <p className="sr-only" aria-live="polite">
          {t('deck.status', { n: index + 1, total: count, title: slideLabel })}
        </p>
      </footer>

      {help && <Shortcuts onClose={() => setHelp(false)} />}

      {printing &&
        createPortal(
          <DeckContext.Provider value={{ inDeck: true, printing: true }}>
            <div className="deck-print">
              {slides.map((s, i) => (
                <section key={i} className="deck-page">
                  <div className="w-full">{s}</div>
                  <p className="deck-page-number">
                    {lesson.title} · {i + 1} / {count}
                  </p>
                </section>
              ))}
            </div>
          </DeckContext.Provider>,
          document.body,
        )}
    </div>
  );
}

function Shortcuts({ onClose }: { onClose: () => void }) {
  const rows: [string[], string][] = [
    [['→', t('deck.keySpace')], t('deck.next')],
    [['←'], t('deck.prev')],
    [[t('deck.keyHome'), t('deck.keyEnd')], t('deck.firstLast')],
    [['F'], t('deck.fullscreen')],
    [['N'], t('deck.notes')],
    [['Esc', 'P'], t('deck.exit')],
    [['?'], t('deck.shortcuts')],
  ];
  return (
    <div className="anim-fade-in absolute inset-0 z-10 flex items-center justify-center bg-overlay backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-label={t('deck.shortcuts')} className="anim-dialog-in w-[min(26rem,calc(100vw-2rem))] rounded-dialog border border-line bg-surface-3 p-6 shadow-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="mb-4 font-display text-h3 font-semibold text-ink">{t('deck.shortcuts')}</h2>
        <dl className="space-y-2.5">
          {rows.map(([keys, label]) => (
            <div key={label} className="flex items-center justify-between gap-4 text-body-sm">
              <dt className="text-ink-soft">{label}</dt>
              <dd className="flex gap-1">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-caption text-ink-muted">{t('deck.clickHint')}</p>
      </div>
    </div>
  );
}
