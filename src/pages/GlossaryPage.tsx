import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { GLOSSARY } from '@/content/glossary';

export function GlossaryPage() {
  const [q, setQ] = useState('');
  const loc = useLocation();
  const sorted = useMemo(() => [...GLOSSARY].sort((a, b) => a.term.localeCompare(b.term)), []);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return sorted;
    return sorted.filter((g) => `${g.term} ${g.short} ${g.long ?? ''}`.toLowerCase().includes(s));
  }, [q, sorted]);

  useEffect(() => {
    if (loc.hash) {
      const el = document.getElementById(loc.hash.slice(1));
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.classList.add('ring-2', 'ring-accent');
        setTimeout(() => el.classList.remove('ring-2', 'ring-accent'), 1800);
      }
    }
  }, [loc.hash, filtered]);

  const letters = useMemo(() => {
    const m = new Map<string, typeof filtered>();
    for (const g of filtered) {
      const L = g.term[0].toUpperCase();
      if (!m.has(L)) m.set(L, []);
      m.get(L)!.push(g);
    }
    return [...m.entries()];
  }, [filtered]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Glossary</h1>
        <p className="mt-1 text-ink-soft">{GLOSSARY.length} terms, each in one plain sentence first.</p>
      </div>
      <label className="relative block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms…" className="input w-full pl-10" />
      </label>
      <div className="flex flex-wrap gap-1 text-xs">
        {letters.map(([L]) => (
          <a key={L} href={`#letter-${L}`} className="chip hover:chip-on">
            {L}
          </a>
        ))}
      </div>
      {letters.map(([L, items]) => (
        <section key={L} id={`letter-${L}`}>
          <h2 className="mb-2 mt-6 text-xs font-bold uppercase tracking-widest text-ink-soft">{L}</h2>
          <div className="space-y-2">
            {items.map((g) => (
              <div key={g.id} id={g.id} className="rounded-xl border border-line bg-surface p-4 transition">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-bold">{g.term}</h3>
                  {g.lesson && (
                    <Link to={g.lesson} className="text-xs font-semibold text-accent">
                      Read the lesson →
                    </Link>
                  )}
                </div>
                <p className="mt-1">{g.short}</p>
                {g.long && <p className="mt-2 text-sm text-ink-soft">{g.long}</p>}
                {g.related && g.related.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {g.related.map((r) => (
                      <a key={r} href={`#${r}`} className="chip hover:chip-on">
                        {r.replace(/-/g, ' ')}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
