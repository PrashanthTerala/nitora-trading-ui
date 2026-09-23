import { useEffect, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { BookOpen, CandlestickChart, Brain, NotebookPen, Sun, Moon, Menu, X, BookA, GraduationCap } from 'lucide-react';
import { useProgress, overallProgress } from '@/store/progress';
import { STORAGE_KEYS } from '@/lib/storageKeys';

const NAV = [
  { to: '/learn', label: 'Learn', icon: BookOpen },
  { to: '/simulator', label: 'Simulator', icon: CandlestickChart },
  { to: '/trainer', label: 'Trainer', icon: Brain },
  { to: '/journal', label: 'Journal', icon: NotebookPen },
  { to: '/glossary', label: 'Glossary', icon: BookA },
];

function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, dark ? 'dark' : 'light');
    } catch {
      /* ignore */
    }
  }, [dark]);
  return { dark, toggle: () => setDark((d) => !d) };
}

export function Shell() {
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const completed = useProgress((s) => s.completed);
  const prog = overallProgress(completed);
  const loc = useLocation();
  const isSim = loc.pathname.startsWith('/simulator');

  useEffect(() => setOpen(false), [loc.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-surface/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-3 px-4">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-ink text-white dark:bg-white dark:text-ink">
              <GraduationCap size={16} />
            </span>
            <span>
              Nitora <span className="text-ink-soft">Trading Academy</span>
            </span>
          </Link>
          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${isActive ? 'bg-accent/10 text-accent' : 'text-ink-soft hover:bg-panel hover:text-ink'}`
                }
              >
                <n.icon size={15} /> {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/learn" className="hidden items-center gap-2 rounded-full border border-line px-3 py-1 text-xs text-ink-soft sm:flex" title="Lessons completed">
              <span className="h-1.5 w-20 overflow-hidden rounded bg-panel">
                <span className="block h-full bg-accent" style={{ width: `${prog.pct}%` }} />
              </span>
              {prog.done}/{prog.total}
            </Link>
            <button type="button" onClick={toggle} className="rounded-md p-2 text-ink-soft hover:bg-panel hover:text-ink" aria-label="Toggle theme">
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-md p-2 text-ink-soft hover:bg-panel md:hidden" aria-label="Menu">
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="border-t border-line bg-surface px-4 py-2 md:hidden">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-accent/10 text-accent' : 'text-ink-soft'}`}>
                <n.icon size={15} /> {n.label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>
      <main className={`flex-1 ${isSim ? '' : 'mx-auto w-full max-w-[1200px] px-4 py-8'}`}>
        <Outlet />
      </main>
      {!isSim && (
        <footer className="border-t border-line py-8 text-center text-xs text-ink-soft">
          <p>Nitora Trading Academy is an educational tool. Nothing here is financial advice. All market data in the simulator is synthetic.</p>
          <p className="mt-1">
            <Link to="/guide" className="underline">How this site works</Link>
          </p>
        </footer>
      )}
    </div>
  );
}
