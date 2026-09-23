import { AnimatePresence, m } from 'motion/react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/theme';
import { t } from '@/i18n';
import { cx } from '@/components/ui/cx';

/** Sun and moon swap with a quarter-turn; with reduced motion, MotionConfig makes it a plain swap. */
export function ThemeToggle({ className }: { className?: string }) {
  const dark = useTheme((s) => s.dark);
  const toggle = useTheme((s) => s.toggle);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? t('header.themeToLight') : t('header.themeToDark')}
      className={cx('relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-control text-ink-soft transition-colors duration-(--duration-fast) hover:bg-surface-2 hover:text-ink', className)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={dark ? 'sun' : 'moon'}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className="flex"
        >
          {dark ? <Sun size={18} strokeWidth={1.5} /> : <Moon size={18} strokeWidth={1.5} />}
        </m.span>
      </AnimatePresence>
    </button>
  );
}
