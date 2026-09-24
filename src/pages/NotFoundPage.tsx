import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Brain, CandlestickChart, NotebookPen } from 'lucide-react';
import { Illustration } from '@/components/ui/Illustration';
import { usePageMeta } from '@/lib/pageMeta';
import { t } from '@/i18n';

/** The four rooms, as the tab bar names them. */
const ROOMS = [
  { to: '/learn', icon: BookOpen, title: 'notFound.learn', blurb: 'notFound.learnBlurb' },
  { to: '/simulator', icon: CandlestickChart, title: 'notFound.simulator', blurb: 'notFound.simulatorBlurb' },
  { to: '/trainer', icon: Brain, title: 'notFound.trainer', blurb: 'notFound.trainerBlurb' },
  { to: '/journal', icon: NotebookPen, title: 'notFound.journal', blurb: 'notFound.journalBlurb' },
] as const;

export function NotFoundPage() {
  usePageMeta({ title: t('meta.notFound'), noindex: true });
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center py-6 text-center">
      <Illustration id="broken-candle" eager className="max-w-md" />
      <p className="-mt-6 font-mono text-mono-sm font-semibold text-down">404</p>
      <h1 className="mt-2 max-w-xl text-balance font-display text-h1 font-semibold tracking-tight">{t('notFound.title')}</h1>
      <p className="mt-3 max-w-lg text-body-lg text-ink-soft">{t('notFound.body')}</p>
      <nav aria-label={t('notFound.rooms')} className="mt-10 w-full">
        <ul className="grid gap-3 text-left sm:grid-cols-2">
          {ROOMS.map((r) => (
            <li key={r.to}>
              <Link
                to={r.to}
                className="group flex items-center gap-4 rounded-card border border-line bg-surface-1 p-4 shadow-1 transition-[border-color,box-shadow,transform] duration-(--duration-fast) hover:-translate-y-0.5 hover:border-accent hover:shadow-2"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-accent-soft text-accent">
                  <r.icon size={20} strokeWidth={1.5} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{t(r.title)}</span>
                  <span className="block text-body-sm text-ink-soft">{t(r.blurb)}</span>
                </span>
                <ArrowRight size={16} className="shrink-0 text-ink-soft transition-transform duration-(--duration-fast) group-hover:translate-x-0.5 group-hover:text-accent" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
