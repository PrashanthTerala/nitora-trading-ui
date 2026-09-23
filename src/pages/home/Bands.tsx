import { Link } from 'react-router-dom';
import { ArrowRight, CandlestickChart, ShieldCheck } from 'lucide-react';
import { ALL_LESSONS } from '@/content/curriculum';
import { useProgress, overallProgress, nextLesson } from '@/store/progress';
import { buttonClass } from '@/components/ui/Button';
import { t } from '@/i18n';

/** The honesty promise, verbatim, as a quiet full-width band. */
export function HonestyBand() {
  return (
    <section className="border-y border-line-subtle bg-surface-1">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-start md:gap-10 md:py-20">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card border border-line bg-surface-2 text-up">
          <ShieldCheck size={28} strokeWidth={1.5} aria-hidden />
        </span>
        <div className="max-w-3xl">
          <h2 className="font-display text-h2 font-semibold text-ink">{t('home.honestyTitle')}</h2>
          <p className="mt-3 text-body-lg text-ink-soft">{t('home.honestyBody')}</p>
        </div>
      </div>
    </section>
  );
}

export function FinalCta() {
  const completed = useProgress((s) => s.completed);
  const started = overallProgress(completed).done > 0;
  const next = nextLesson(completed);
  return (
    <section className="mx-auto max-w-[1200px] px-4 py-section sm:px-6">
      <div
        className="relative overflow-hidden rounded-feature border border-line px-6 py-14 text-center sm:px-12 md:py-20"
        style={{ backgroundImage: 'radial-gradient(80% 120% at 50% 0%, var(--color-accent-soft), transparent 70%)' }}
      >
        <h2 className="mx-auto max-w-2xl font-display text-display font-bold text-ink">{started && next ? t('home.ctaTitleContinue') : t('home.ctaTitle', { minutes: ALL_LESSONS[0].minutes })}</h2>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-ink-soft">{t('home.ctaLead')}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to={next ? next.path : '/learn'} className={buttonClass({ size: 'lg' })}>
            <span className="max-w-[18rem] truncate">{started && next ? t('home.continue', { title: next.title }) : t('home.start')}</span>
            <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
          </Link>
          <Link to="/simulator" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
            <CandlestickChart size={18} strokeWidth={1.5} aria-hidden /> {t('home.simulator')}
          </Link>
        </div>
      </div>
    </section>
  );
}
