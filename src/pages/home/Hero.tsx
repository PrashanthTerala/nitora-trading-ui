import { Link } from 'react-router-dom';
import { ArrowRight, CandlestickChart } from 'lucide-react';
import { CURRICULUM, TOTAL_LESSONS, TOTAL_MINUTES } from '@/content/curriculum';
import { useProgress, overallProgress, nextLesson } from '@/store/progress';
import { buttonClass } from '@/components/ui/Button';
import { chipClass } from '@/components/ui/Chip';
import { CountUp } from '@/components/ui/CountUp';
import { t } from '@/i18n';
import { HeroPoster } from './HeroPoster';

export function Hero() {
  const completed = useProgress((s) => s.completed);
  const prog = overallProgress(completed);
  const next = nextLesson(completed);
  const stats = [
    { label: t('home.statLessons'), value: TOTAL_LESSONS },
    { label: t('home.statModules'), value: CURRICULUM.length },
    { label: t('home.statHours'), value: Math.round(TOTAL_MINUTES / 60) },
  ];

  return (
    <section className="relative overflow-hidden border-b border-line-subtle">
      <div className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 pb-16 pt-12 sm:px-6 md:pb-24 md:pt-20 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <span className={chipClass({ tone: 'accent', size: 'md' }, 'mb-6')}>{t('home.eyebrow')}</span>
          <h1 className="font-display text-display font-bold text-ink">
            {t('home.title')}
            <br />
            <span className="text-accent">{t('home.titleAccent')}</span>
          </h1>
          <p className="mt-6 max-w-xl text-body-lg text-ink-soft">{t('home.lead')}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={next ? next.path : '/learn'} className={buttonClass({ size: 'lg' })}>
              <span className="max-w-[18rem] truncate">{prog.done > 0 && next ? t('home.continue', { title: next.title }) : t('home.start')}</span>
              <ArrowRight size={18} strokeWidth={1.5} aria-hidden />
            </Link>
            <Link to="/simulator" className={buttonClass({ variant: 'secondary', size: 'lg' })}>
              <CandlestickChart size={18} strokeWidth={1.5} aria-hidden /> {t('home.simulator')}
            </Link>
          </div>
          <dl className="mt-10 grid max-w-md grid-cols-3 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-card border border-line bg-surface-1 px-4 py-3">
                <dt className="text-caption text-ink-muted">{s.label}</dt>
                <dd className="mt-1 font-mono text-mono-lg font-semibold text-ink tabular-nums">
                  <CountUp value={s.value} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="mx-auto w-full max-w-[560px] lg:max-w-none">
          <HeroPoster />
        </div>
      </div>
    </section>
  );
}
