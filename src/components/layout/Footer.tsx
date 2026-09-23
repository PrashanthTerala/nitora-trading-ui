import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { t } from '@/i18n';
import { LogoMark } from './Logo';

const link = 'text-body-sm text-ink-soft transition-colors duration-(--duration-fast) hover:text-ink';

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface-1">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1fr_1fr_1.6fr]">
        <nav aria-label={t('footer.product')}>
          <h2 className="mb-3 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('footer.product')}</h2>
          <ul className="space-y-2">
            <li><Link className={link} to="/simulator">{t('nav.simulator')}</Link></li>
            <li><Link className={link} to="/trainer">{t('nav.trainer')}</Link></li>
            <li><Link className={link} to="/journal">{t('nav.journal')}</Link></li>
          </ul>
        </nav>
        <nav aria-label={t('footer.learn')}>
          <h2 className="mb-3 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">{t('footer.learn')}</h2>
          <ul className="space-y-2">
            <li><Link className={link} to="/learn">{t('footer.curriculum')}</Link></li>
            <li><Link className={link} to="/glossary">{t('nav.glossary')}</Link></li>
            <li><Link className={link} to="/guide">{t('footer.howItWorks')}</Link></li>
          </ul>
        </nav>
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-caption font-semibold uppercase tracking-[0.08em] text-ink-muted">
            <ShieldCheck size={14} strokeWidth={1.5} aria-hidden /> {t('footer.honesty')}
          </h2>
          <p className="max-w-md text-body-sm text-ink-soft">{t('footer.honestyText')}</p>
        </div>
      </div>
      <div className="border-t border-line-subtle">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:px-6">
          <span className="flex items-center gap-2 text-ink-soft" aria-hidden>
            <LogoMark size={16} />
          </span>
          <p className="text-caption text-ink-muted">{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
}
