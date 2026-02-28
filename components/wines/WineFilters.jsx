'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

const TYPES = [
  { value: '', label: 'Toate tipurile' },
  { value: 'RED',       label: '🔴 Roșu' },
  { value: 'WHITE',     label: '🟡 Alb' },
  { value: 'ROSE',      label: '🌸 Roze' },
  { value: 'SPARKLING', label: '✨ Spumant' },
  { value: 'DESSERT',   label: '🍯 Desert' },
  { value: 'FORTIFIED', label: '🏺 Fortifiat' },
];

const STATUSES = [
  { value: '', label: 'Toate statusurile' },
  { value: 'IN_CELLAR', label: 'În pivniță' },
  { value: 'CONSUMED',  label: 'Consumat' },
  { value: 'SOLD',      label: 'Vândut' },
  { value: 'GIFTED',    label: 'Dăruit' },
];

export default function WineFilters({ activeFilters = {} }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(activeFilters.search || '');

  const updateFilter = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const handleSearch = (e) => {
    e.preventDefault();
    updateFilter('search', search);
  };

  const clearAll = () => {
    setSearch('');
    router.push(pathname);
  };

  const hasFilters = Object.values(activeFilters).some(Boolean);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&display=swap');

        .wf-wrap {
          font-family: 'Jost', sans-serif;
          margin-bottom: 2rem;
        }

        .wf-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        /* Search */
        .wf-search-form {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15);
          border-radius: 8px;
          overflow: hidden;
          transition: border-color 0.2s;
          flex: 1;
          min-width: 180px;
          max-width: 280px;
        }
        .wf-search-form:focus-within {
          border-color: rgba(196,69,105,0.4);
        }
        .wf-search-icon {
          padding: 0 0.75rem;
          color: rgba(245,230,232,0.3);
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .wf-search-input {
          flex: 1;
          padding: 0.6rem 0 0.6rem;
          background: transparent;
          border: none;
          outline: none;
          color: #f5e6e8;
          font-family: 'Jost', sans-serif;
          font-size: 0.82rem;
          font-weight: 300;
        }
        .wf-search-input::placeholder { color: rgba(245,230,232,0.25); }
        .wf-search-btn {
          padding: 0.6rem 0.85rem;
          background: rgba(196,69,105,0.15);
          border: none;
          color: rgba(245,230,232,0.6);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Jost', sans-serif;
          letter-spacing: 0.05em;
        }
        .wf-search-btn:hover { background: rgba(196,69,105,0.3); color: #f5e6e8; }

        /* Selects */
        .wf-select {
          padding: 0.6rem 2rem 0.6rem 0.85rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15);
          border-radius: 8px;
          color: rgba(245,230,232,0.7);
          font-family: 'Jost', sans-serif;
          font-size: 0.78rem;
          font-weight: 300;
          outline: none;
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(196,69,105,0.6)' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.6rem center;
          transition: border-color 0.2s;
          min-width: 130px;
        }
        .wf-select:focus { border-color: rgba(196,69,105,0.4); }
        .wf-select option { background: #1a0810; color: #f5e6e8; }
        .wf-select.active { border-color: rgba(196,69,105,0.5); color: #f5e6e8; }

        /* Clear btn */
        .wf-clear {
          padding: 0.6rem 0.85rem;
          background: transparent;
          border: 1px solid rgba(196,69,105,0.2);
          border-radius: 8px;
          color: rgba(196,69,105,0.7);
          font-family: 'Jost', sans-serif;
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .wf-clear:hover { background: rgba(196,69,105,0.1); color: #c44569; border-color: rgba(196,69,105,0.4); }

        /* Active tags */
        .wf-tags { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.75rem; }
        .wf-tag {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.2rem 0.6rem;
          background: rgba(196,69,105,0.12);
          border: 1px solid rgba(196,69,105,0.25);
          border-radius: 20px;
          font-size: 0.68rem;
          color: rgba(245,230,232,0.7);
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s;
        }
        .wf-tag:hover { background: rgba(196,69,105,0.2); color: #f5e6e8; }
        .wf-tag-x { font-size: 0.75rem; color: rgba(196,69,105,0.7); }

        @media (max-width: 640px) {
          .wf-row { gap: 0.5rem; }
          .wf-search-form { max-width: 100%; min-width: 100%; order: -1; }
          .wf-select { min-width: 0; flex: 1; }
        }
      `}</style>

      <div className="wf-wrap">
        <div className="wf-row">
          {/* Search */}
          <form className="wf-search-form" onSubmit={handleSearch}>
            <span className="wf-search-icon">🔍</span>
            <input
              type="text"
              className="wf-search-input"
              placeholder="Caută vin, producător..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="wf-search-btn">Caută</button>
          </form>

          {/* Type filter */}
          <select
            className={`wf-select ${activeFilters.type ? 'active' : ''}`}
            value={activeFilters.type || ''}
            onChange={(e) => updateFilter('type', e.target.value)}
          >
            {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          {/* Status filter */}
          <select
            className={`wf-select ${activeFilters.status ? 'active' : ''}`}
            value={activeFilters.status || ''}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          {/* Clear */}
          {hasFilters && (
            <button className="wf-clear" onClick={clearAll}>
              ✕ Resetează
            </button>
          )}
        </div>

        {/* Active filter tags */}
        {hasFilters && (
          <div className="wf-tags">
            {activeFilters.search && (
              <span className="wf-tag" onClick={() => { setSearch(''); updateFilter('search', ''); }}>
                "{activeFilters.search}" <span className="wf-tag-x">×</span>
              </span>
            )}
            {activeFilters.type && (
              <span className="wf-tag" onClick={() => updateFilter('type', '')}>
                {TYPES.find(t => t.value === activeFilters.type)?.label} <span className="wf-tag-x">×</span>
              </span>
            )}
            {activeFilters.status && (
              <span className="wf-tag" onClick={() => updateFilter('status', '')}>
                {STATUSES.find(s => s.value === activeFilters.status)?.label} <span className="wf-tag-x">×</span>
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );
}
