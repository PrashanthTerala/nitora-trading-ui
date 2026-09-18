import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useProgress, lessonKey } from '@/store/progress';

export interface QuizQuestion {
  q: string;
  options: string[];
  /** index into options */
  answer: number;
  explain?: string;
}

export function Quiz({ questions, title = 'Check your understanding' }: { questions: QuizQuestion[]; title?: string }) {
  const { moduleId, lessonId } = useParams();
  const recordQuiz = useProgress((s) => s.recordQuiz);
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = questions.every((_, i) => picked[i] !== undefined);
  const score = questions.reduce((s, q, i) => s + (picked[i] === q.answer ? 1 : 0), 0);

  const submit = () => {
    setSubmitted(true);
    if (moduleId && lessonId) recordQuiz(lessonKey(moduleId, lessonId), score, questions.length);
  };
  const reset = () => {
    setPicked({});
    setSubmitted(false);
  };

  return (
    <section className="not-prose my-10 rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold">{title}</h3>
        {submitted && (
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${score === questions.length ? 'bg-up/15 text-up' : 'bg-accent/15 text-accent'}`}>
            {score} / {questions.length}
          </span>
        )}
      </div>
      <ol className="space-y-6">
        {questions.map((q, qi) => {
          const chosen = picked[qi];
          return (
            <li key={qi}>
              <p className="mb-2 font-semibold">
                <span className="mr-2 text-ink-soft">{qi + 1}.</span>
                {q.q}
              </p>
              <div className="grid gap-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = q.answer === oi;
                  let cls = 'border-line hover:border-accent/60 hover:bg-accent/5';
                  if (submitted && isCorrect) cls = 'border-up bg-up/10';
                  else if (submitted && isChosen && !isCorrect) cls = 'border-down bg-down/10';
                  else if (isChosen) cls = 'border-accent bg-accent/10';
                  return (
                    <button
                      key={oi}
                      type="button"
                      disabled={submitted}
                      onClick={() => setPicked((p) => ({ ...p, [qi]: oi }))}
                      className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-[15px] transition ${cls} disabled:cursor-default`}
                    >
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs ${isChosen ? 'border-accent bg-accent text-white' : 'border-line'}`}>
                        {String.fromCharCode(65 + oi)}
                      </span>
                      <span>{opt}</span>
                      {submitted && isCorrect && <CheckCircle2 size={16} className="ml-auto text-up" />}
                      {submitted && isChosen && !isCorrect && <XCircle size={16} className="ml-auto text-down" />}
                    </button>
                  );
                })}
              </div>
              {submitted && q.explain && <p className="mt-2 rounded-md bg-panel px-3 py-2 text-sm text-ink-soft">{q.explain}</p>}
            </li>
          );
        })}
      </ol>
      <div className="mt-5 flex gap-3">
        {!submitted ? (
          <button type="button" onClick={submit} disabled={!allAnswered} className="btn-primary disabled:opacity-40">
            Check answers
          </button>
        ) : (
          <button type="button" onClick={reset} className="btn-ghost">
            <RotateCcw size={14} /> Try again
          </button>
        )}
      </div>
    </section>
  );
}
