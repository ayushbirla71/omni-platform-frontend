import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Menu, Printer, Search, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { manualChapters } from '../content/manual';
import { MarkdownRenderer } from '../components/docs/MarkdownRenderer';
import { Button } from '../components/common/Button';
import { cn } from '../lib/utils';

const BASE = '/documentation/user-manual';

export const UserManualPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { chapter } = useParams<{ chapter?: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [outline, setOutline] = useState<{ id: string; text: string; level: number }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const index = manualChapters.findIndex((c) => c.slug === chapter);
  const current = index >= 0 ? manualChapters[index] : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return manualChapters;
    return manualChapters.filter((c) => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q));
  }, [query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof manualChapters>();
    filtered.forEach((c) => map.set(c.group, [...(map.get(c.group) || []), c]));
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setNavOpen(false);
    const el = contentRef.current;
    if (!el) return;
    setOutline(
      Array.from(el.querySelectorAll('h2[id], h3[id]')).map((h) => ({
        id: h.id,
        text: h.textContent || '',
        level: h.tagName === 'H2' ? 2 : 3,
      }))
    );
  }, [chapter]);

  if (!current) return <Navigate to={`${BASE}/${manualChapters[0].slug}`} replace />;

  const prev = manualChapters[index - 1];
  const next = manualChapters[index + 1];

  const sidebar = (
    <nav className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the manual..."
          className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>
      {groups.length === 0 && <p className="px-1 text-sm text-gray-500">No chapters match "{query}".</p>}
      {groups.map(([group, items]) => (
        <div key={group}>
          <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">{group}</p>
          <ul className="space-y-0.5">
            {items.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`${BASE}/${c.slug}`}
                  className={cn(
                    'block rounded-lg px-2.5 py-1.5 text-[13px] leading-snug transition-colors',
                    c.slug === current.slug ? 'bg-primary-600 font-semibold text-white' : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  {c.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className={cn('mx-auto max-w-7xl pb-16', !isAuthenticated && 'px-4 pt-6 sm:px-6 sm:pt-8')}>
      {!isAuthenticated && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-4 print:hidden">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-lg font-bold text-white">Ω</div>
            <div>
              <h2 className="text-sm font-bold leading-tight text-gray-900">Omni Platform</h2>
              <p className="text-[10px] text-gray-500">User Manual</p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="outline" size="sm" className="text-xs">Log In</Button></Link>
            <Link to="/signup"><Button variant="primary" size="sm" className="text-xs">Start Free Trial</Button></Link>
          </div>
        </div>
      )}

      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen className="h-4 w-4 text-primary-600" />
          <Link to="/documentation" className="hover:text-gray-800">Documentation</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="font-semibold text-gray-900">User Manual</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setNavOpen(true)}>
            <Menu className="mr-1.5 h-4 w-4" /> Chapters
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block print:hidden">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">{sidebar}</div>
        </aside>

        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-gray-900/50" onClick={() => setNavOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-white p-4 shadow-xl">
              <button
                className="mb-3 rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
                onClick={() => setNavOpen(false)}
                aria-label="Close chapters"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </div>
          </div>
        )}

        <article className="min-w-0 flex-1 rounded-2xl border border-gray-200/80 bg-white p-5 sm:p-8 print:border-0 print:p-0">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary-600">{current.group}</p>
          <div ref={contentRef}>
            <MarkdownRenderer content={current.content} />
          </div>
          <div className="mt-10 flex items-stretch justify-between gap-3 border-t border-gray-200 pt-5 print:hidden">
            {prev ? (
              <button
                onClick={() => navigate(`${BASE}/${prev.slug}`)}
                className="flex max-w-[48%] items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-left text-sm hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-[11px] text-gray-500">Previous</span>
                  <span className="font-semibold text-gray-900">{prev.title}</span>
                </span>
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button
                onClick={() => navigate(`${BASE}/${next.slug}`)}
                className="flex max-w-[48%] items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-right text-sm hover:bg-gray-50"
              >
                <span>
                  <span className="block text-[11px] text-gray-500">Next</span>
                  <span className="font-semibold text-gray-900">{next.title}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        </article>

        {outline.length > 0 && (
          <aside className="hidden w-56 shrink-0 xl:block print:hidden">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-500">On this page</p>
              <ul className="space-y-1 border-l border-gray-200">
                {outline.map((o) => (
                  <li key={o.id}>
                    <a
                      href={`#${o.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(o.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={cn('block py-0.5 text-xs leading-snug text-gray-600 hover:text-primary-700', o.level === 3 ? 'pl-6' : 'pl-3')}
                    >
                      {o.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
