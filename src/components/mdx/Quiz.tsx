import { useId, useState } from 'react';
import { useParams } from 'react-router-dom';
import { m } from 'motion/react';
import { Check, RotateCcw, X } from 'lucide-react';
import { useProgress, lessonKey } from '@/store/progress';
import { Button } from '@/components/ui/Button';
import { Ring } from '@/components/ui/Ring';
import { cx } from '@/components/ui/cx';
import { t } from '@/i18n';

export interface QuizQuestion {
  q: string;
  options: string[];
  /** index into options */
  answer: number;
  explain?: string;
}

/**
 * The end-of-lesson quiz. Each question is a group of pressable answers (Tab and Enter, no
 * arrow-key trap inside a long lesson); "Check answers" marks every option
 * at once -- the right one pops, a wrong pick shakes -- and a ring shows the score, which is
 * saved as the lesson's best. Motion is transform-only, so reduced motion simply removes it.
 */
export function Quiz({ questions, title }: { questions: QuizQuestion[]; title?: string }) {
  const { moduleId, lessonId } = useParams();
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const best = useProgress((s) => (moduleId && lessonId ? s.quizScores[lessonKey(moduleId, lessonId)] : undefined));
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [round, setRound] = useState(0);
  const baseId = useId();

  const answered = questions.filter((_, i) => picked[i] !== undefined).length;
  const allAnswered = answered === questions.length;
  const score = questions.reduce((s, q, i) => s + (picked[i] === q.answer ? 1 : 0), 0);
  const perfect = score === questions.length;

  const submit = () => {
    setSubmitted(true);
    if (moduleId && lessonId) recordQuiz(lessonKey(moduleId, lessonId), score, questions.length);
  };
  const retry = () => {
    setPicked({});
    setSubmitted(false);
    setRound((r) => r + 1);
  };

  return (
    <section id="quiz" data-toc="2" data-toc-label={title ?? t('mdx.quiz.title')} className="not-prose my-12 overflow-hidden rounded-card border border-line bg-surface-1 shadow-1">
      <header className="flex items-center gap-4 border-b border-line-subtle bg-surface-2 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-h3 font-semibold text-ink">{title ?? t('mdx.quiz.title')}</h3>
          <p className="mt-0.5 text-body-sm text-ink-soft">
            {submitted
              ? perfect
                ? t('mdx.quiz.perfect')
                : t('mdx.quiz.result', { score, total: questions.length })
              : best
                ? t('mdx.quiz.best', { score: best.score, total: best.total })
                : t('mdx.quiz.intro', { count: questions.length })}
          </p>
        </div>
        <Ring
          value={submitted ? score / questions.length : answered / questions.length}
          size={52}
          stroke={4}
          tone={submitted && perfect ? 'up' : 'accent'}
          label={submitted ? t('mdx.quiz.result', { score, total: questions.length }) : t('mdx.quiz.progress', { answered, total: questions.length })}
        >
          <span className="font-mono text-mono-sm font-semibold text-ink tabular-nums">{submitted ? `${score}/${questions.length}` : `${answered}/${questions.length}`}</span>
        </Ring>
      </header>

      <ol className="divide-y divide-line-subtle">
        {questions.map((q, qi) => {
          const chosen = picked[qi];
          const qid = `${baseId}-q${qi}`;
          return (
            <li key={qi} className="px-5 py-5">
              <p id={qid} className="mb-3 font-semibold text-ink">
                <span className="mr-2 font-mono text-mono-sm text-ink-muted">{qi + 1}.</span>
                {q.q}
              </p>
              <div role="group" aria-labelledby={qid} className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = q.answer === oi;
                  const state = submitted ? (isCorrect ? 'correct' : isChosen ? 'wrong' : 'idle') : isChosen ? 'chosen' : 'idle';
                  return (
                    <m.button
                      key={`${round}-${oi}`}
                      type="button"
                      aria-pressed={isChosen}
                      disabled={submitted}
                      onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                      animate={
                        state === 'correct' && isChosen ? { scale: [1, 1.02, 1] } : state === 'wrong' ? { x: [0, -5, 5, -3, 3, 0] } : undefined
                      }
                      transition={{ duration: 0.36, ease: 'easeOut' }}
                      className={cx(
                        'flex items-center gap-3 rounded-control border px-3 py-2.5 text-left text-body-sm transition-colors duration-(--duration-fast) disabled:cursor-default',
                        state === 'idle' && 'border-line text-ink hover:border-line-strong hover:bg-surface-2',
                        state === 'chosen' && 'border-accent bg-accent-soft text-ink',
                        state === 'correct' && 'border-up bg-up-soft text-ink',
                        state === 'wrong' && 'border-down bg-down-soft text-ink',
                        submitted && state === 'idle' && 'opacity-70',
                      )}
                    >
                      <span
                        aria-hidden
                        className={cx(
                          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border font-mono text-mono-sm font-semibold',
                          state === 'chosen' && 'border-accent bg-accent text-on-accent',
                          state === 'correct' && 'border-up bg-up text-on-up',
                          state === 'wrong' && 'border-down bg-down text-on-down',
                          state === 'idle' && 'border-line-strong text-ink-soft',
                        )}
                      >
                        {state === 'correct' ? <Check size={13} strokeWidth={3} /> : state === 'wrong' ? <X size={13} strokeWidth={3} /> : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="flex-1">{opt}</span>
                      {submitted && isCorrect && <span className="sr-only">{t('mdx.quiz.correctAnswer')}</span>}
                      {submitted && isChosen && !isCorrect && <span className="sr-only">{t('mdx.quiz.yourAnswer')}</span>}
                    </m.button>
                  );
                })}
              </div>
              {submitted && q.explain && (
                <m.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-3 rounded-control border-l-2 border-line-strong bg-surface-2 px-3 py-2 text-body-sm text-ink-soft"
                >
                  {q.explain}
                </m.p>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="flex flex-wrap items-center gap-3 border-t border-line-subtle bg-surface-2 px-5 py-4">
        {!submitted ? (
          <>
            <Button onClick={submit} disabled={!allAnswered}>
              {t('mdx.quiz.check')}
            </Button>
            {!allAnswered && <span className="text-body-sm text-ink-muted">{t('mdx.quiz.remaining', { count: questions.length - answered })}</span>}
          </>
        ) : (
          <Button variant="secondary" onClick={retry}>
            <RotateCcw size={15} strokeWidth={1.75} aria-hidden /> {t('mdx.quiz.retry')}
          </Button>
        )}
        <p className="sr-only" role="status">
          {submitted ? t('mdx.quiz.result', { score, total: questions.length }) : ''}
        </p>
      </footer>
    </section>
  );
}
