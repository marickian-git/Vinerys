'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';

const WINE_TYPES = [
  { value: '', label: 'Toate tipurile' },
  { value: 'RED',       label: '🔴 Roșu' },
  { value: 'WHITE',     label: '🟡 Alb' },
  { value: 'ROSE',      label: '🌸 Roze' },
  { value: 'SPARKLING', label: '✨ Spumant' },
  { value: 'DESSERT',   label: '🍯 Desert' },
  { value: 'FORTIFIED', label: '🏺 Fortifiat' },
];

const STATUSES = [
  { value: '',          label: 'Toate statusurile' },
  { value: 'IN_CELLAR', label: '🟢 În pivniță' },
  { value: 'CONSUMED',  label: '⚪ Consumat' },
  { value: 'SOLD',      label: '🟡 Vândut' },
  { value: 'GIFTED',    label: '🌸 Dăruit' },
];

const SORT_OPTIONS = [
  { value: 'newest',       label: 'Cele mai noi' },
  { value: 'oldest',       label: 'Cele mai vechi' },
  { value: 'name_asc',     label: 'Nume A→Z' },
  { value: 'name_desc',    label: 'Nume Z→A' },
  { value: 'vintage_desc', label: 'An (nou→vechi)' },
  { value: 'vintage_asc',  label: 'An (vechi→nou)' },
  { value: 'rating_desc',  label: 'Rating ↓' },
  { value: 'price_asc',    label: 'Preț ↑' },
  { value: 'price_desc',   label: 'Preț ↓' },
];

const PAGE_SIZES = [12, 24, 48];

export default function WineFilters({ countries = [], totalResults = 0 }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [search,     setSearch]     = useState(params.get('search')     || '');
  const [type,       setType]       = useState(params.get('type')       || '');
  const [status,     setStatus]     = useState(params.get('status')     || '');
  const [sort,       setSort]       = useState(params.get('sort')       || 'newest');
  const [pageSize,   setPageSize]   = useState(params.get('pageSize')   || '24');
  const [country,    setCountry]    = useState(params.get('country')    || '');
  const [vintageMin, setVintageMin] = useState(params.get('vintageMin') || '');
  const [vintageMax, setVintageMax] = useState(params.get('vintageMax') || '');
  const [ratingMin,  setRatingMin]  = useState(params.get('ratingMin')  || '');
  const [priceMax,   setPriceMax]   = useState(params.get('priceMax')   || '');
  const [isFavorite, setIsFavorite] = useState(params.get('isFavorite') || '');

  const push = useCallback((updates) => {
    const p = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) p.set(k, v); else p.delete(k);
    });
    p.delete('page');
    startTransition(() => router.push(`${pathname}?${p.toString()}`));
  }, [params, pathname, router]);

  const handleSearch = (e) => { e.preventDefault(); push({ search }); };

  const clearAll = () => {
    setSearch(''); setType(''); setStatus(''); setSort('newest');
    setCountry(''); setVintageMin(''); setVintageMax('');
    setRatingMin(''); setPriceMax(''); setIsFavorite(''); setPageSize('24');
    startTransition(() => router.push(pathname));
  };

  const hasAdvanced = country || vintageMin || vintageMax || ratingMin || priceMax || isFavorite;

  const activeTags = [
    type       && { key: 'type',       label: WINE_TYPES.find(t => t.value === type)?.label,  clear: () => { setType('');       push({ type: '' }); } },
    status     && { key: 'status',     label: STATUSES.find(s => s.value === status)?.label,  clear: () => { setStatus('');     push({ status: '' }); } },
    country    && { key: 'country',    label: `🌍 ${country}`,                                 clear: () => { setCountry('');    push({ country: '' }); } },
    vintageMin && { key: 'vintageMin', label: `An ≥ ${vintageMin}`,                            clear: () => { setVintageMin(''); push({ vintageMin: '' }); } },
    vintageMax && { key: 'vintageMax', label: `An ≤ ${vintageMax}`,                            clear: () => { setVintageMax(''); push({ vintageMax: '' }); } },
    ratingMin  && { key: 'ratingMin',  label: `${'★'.repeat(parseInt(ratingMin))} min`,        clear: () => { setRatingMin('');  push({ ratingMin: '' }); } },
    priceMax   && { key: 'priceMax',   label: `≤ ${priceMax}€`,                                clear: () => { setPriceMax('');   push({ priceMax: '' }); } },
    isFavorite && { key: 'fav',        label: '❤️ Favorite',                                   clear: () => { setIsFavorite(''); push({ isFavorite: '' }); } },
    search     && { key: 'search',     label: `"${search}"`,                                   clear: () => { setSearch('');     push({ search: '' }); } },
  ].filter(Boolean);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&display=swap');
        .wf-wrap { font-family: 'Jost', sans-serif; margin-bottom: 1.5rem; }
        .wf-pending { opacity: 0.65; pointer-events: none; }

        .wf-row1 { display: flex; gap: 0.65rem; flex-wrap: wrap; align-items: stretch; margin-bottom: 0.65rem; }

        .wf-search-form { display: flex; flex: 2; min-width: 200px; }
        .wf-search-input {
          flex: 1; padding: 0.65rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15); border-right: none;
          border-radius: 8px 0 0 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.82rem; font-weight: 300;
          outline: none; transition: all 0.2s;
        }
        .wf-search-input::placeholder { color: rgba(245,230,232,0.2); }
        .wf-search-input:focus { border-color: rgba(196,69,105,0.4); background: rgba(196,69,105,0.04); }
        .wf-search-btn {
          padding: 0 0.9rem;
          background: rgba(196,69,105,0.12); border: 1px solid rgba(196,69,105,0.15); border-left: none;
          border-radius: 0 8px 8px 0; color: rgba(196,69,105,0.8);
          cursor: pointer; font-size: 0.85rem; transition: all 0.2s;
        }
        .wf-search-btn:hover { background: rgba(196,69,105,0.22); }

        .wf-select {
          padding: 0.65rem 2rem 0.65rem 0.85rem;
          background: rgba(255,255,255,0.04) url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(196,69,105,0.6)' stroke-width='1.5' fill='none'/%3E%3C/svg%3E") no-repeat right 0.65rem center;
          border: 1px solid rgba(196,69,105,0.15); border-radius: 8px;
          color: #f5e6e8; font-family: 'Jost', sans-serif;
          font-size: 0.8rem; font-weight: 300; outline: none;
          appearance: none; cursor: pointer; transition: all 0.2s;
        }
        .wf-select:focus { border-color: rgba(196,69,105,0.4); }
        .wf-select option { background: #1a0810; }

        .wf-advanced-btn {
          padding: 0.65rem 0.9rem; background: transparent;
          border: 1px solid rgba(196,69,105,0.15); border-radius: 8px;
          color: rgba(245,230,232,0.4); font-family: 'Jost', sans-serif;
          font-size: 0.75rem; letter-spacing: 0.06em; cursor: pointer;
          transition: all 0.2s; white-space: nowrap;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .wf-advanced-btn:hover, .wf-advanced-btn.open {
          border-color: rgba(196,69,105,0.35); color: rgba(245,230,232,0.75);
          background: rgba(196,69,105,0.05);
        }
        .wf-adv-dot { width: 6px; height: 6px; border-radius: 50%; background: #c44569; display: none; }
        .wf-adv-dot.on { display: block; }

        .wf-advanced {
          background: rgba(255,255,255,0.02); border: 1px solid rgba(196,69,105,0.1);
          border-radius: 12px; padding: 1.1rem 1.25rem; margin-bottom: 0.65rem;
          display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 0.9rem;
          animation: wfin 0.2s ease;
        }
        @keyframes wfin { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: none; } }

        .wf-adv-label {
          display: block; font-size: 0.62rem; text-transform: uppercase;
          letter-spacing: 0.13em; color: rgba(245,230,232,0.3);
          margin-bottom: 0.4rem; font-weight: 400;
        }
        .wf-adv-input {
          width: 100%; padding: 0.55rem 0.75rem;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(196,69,105,0.12);
          border-radius: 7px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.8rem; font-weight: 300;
          outline: none; transition: all 0.2s;
        }
        .wf-adv-input:focus { border-color: rgba(196,69,105,0.4); background: rgba(196,69,105,0.04); }
        .wf-adv-input::placeholder { color: rgba(245,230,232,0.15); }

        .wf-stars { display: flex; gap: 3px; padding: 0.55rem 0; }
        .wf-star { font-size: 1.15rem; cursor: pointer; color: rgba(245,230,232,0.15); transition: all 0.15s; line-height: 1; }
        .wf-star.on, .wf-star:hover { color: #d4af37; }
        .wf-star:hover { transform: scale(1.2); }

        .wf-fav-btn {
          width: 100%; padding: 0.55rem 0.75rem; cursor: pointer;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(196,69,105,0.12);
          border-radius: 7px; color: rgba(245,230,232,0.4);
          font-family: 'Jost', sans-serif; font-size: 0.8rem; font-weight: 300;
          transition: all 0.2s; text-align: left;
        }
        .wf-fav-btn:hover { border-color: rgba(196,69,105,0.3); }
        .wf-fav-btn.on { border-color: rgba(196,69,105,0.35); color: #c44569; background: rgba(196,69,105,0.07); }

        .wf-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.65rem; align-items: center; }
        .wf-tag {
          display: flex; align-items: center; gap: 0.35rem;
          padding: 0.28rem 0.6rem; font-size: 0.7rem;
          background: rgba(196,69,105,0.1); border: 1px solid rgba(196,69,105,0.2);
          border-radius: 20px; color: rgba(245,230,232,0.65); font-family: 'Jost', sans-serif;
        }
        .wf-tag-x { cursor: pointer; opacity: 0.5; transition: opacity 0.15s; line-height: 1; }
        .wf-tag-x:hover { opacity: 1; color: #c44569; }
        .wf-clear { font-size: 0.68rem; color: rgba(196,69,105,0.6); background: none; border: none; cursor: pointer; font-family: 'Jost', sans-serif; text-decoration: underline; text-underline-offset: 2px; transition: color 0.2s; }
        .wf-clear:hover { color: #c44569; }

        .wf-row2 { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem; }
        .wf-row2-left { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .wf-count { font-size: 0.72rem; color: rgba(245,230,232,0.25); }
        .wf-count b { color: rgba(245,230,232,0.5); font-weight: 400; }

        @media (max-width: 640px) {
          .wf-search-form { min-width: 100%; }
          .wf-advanced { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className={`wf-wrap ${isPending ? 'wf-pending' : ''}`}>

        {/* Row 1: search + dropdowns + advanced toggle */}
        <div className="wf-row1">
          <form className="wf-search-form" onSubmit={handleSearch}>
            <input className="wf-search-input" placeholder="Caută vin, producător, regiune..." value={search} onChange={e => setSearch(e.target.value)} />
            <button type="submit" className="wf-search-btn">🔍</button>
          </form>

          <select className="wf-select" value={type} onChange={e => { setType(e.target.value); push({ type: e.target.value }); }}>
            {WINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>

          <select className="wf-select" value={status} onChange={e => { setStatus(e.target.value); push({ status: e.target.value }); }}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <button type="button" className={`wf-advanced-btn ${advancedOpen ? 'open' : ''}`} onClick={() => setAdvancedOpen(o => !o)}>
            <span>⚙️ Filtre avansate</span>
            <div className={`wf-adv-dot ${hasAdvanced ? 'on' : ''}`} />
            <span style={{ fontSize: '0.55rem', opacity: 0.5 }}>{advancedOpen ? '▲' : '▼'}</span>
          </button>
        </div>

        {/* Advanced panel */}
        {advancedOpen && (
          <div className="wf-advanced">
            <div>
              <label className="wf-adv-label">Țară</label>
              {countries.length > 0 ? (
                <select className="wf-select wf-adv-input" style={{ padding: '0.55rem 2rem 0.55rem 0.75rem' }} value={country} onChange={e => { setCountry(e.target.value); push({ country: e.target.value }); }}>
                  <option value="">Toate</option>
                  {countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              ) : (
                <input className="wf-adv-input" placeholder="ex. România" value={country} onChange={e => setCountry(e.target.value)} onBlur={() => push({ country })} />
              )}
            </div>

            <div>
              <label className="wf-adv-label">An de la</label>
              <input type="number" className="wf-adv-input" placeholder="ex. 2010" min="1800" max="2030" value={vintageMin} onChange={e => setVintageMin(e.target.value)} onBlur={() => push({ vintageMin })} />
            </div>

            <div>
              <label className="wf-adv-label">An până la</label>
              <input type="number" className="wf-adv-input" placeholder="ex. 2022" min="1800" max="2030" value={vintageMax} onChange={e => setVintageMax(e.target.value)} onBlur={() => push({ vintageMax })} />
            </div>

            <div>
              <label className="wf-adv-label">Preț maxim (€)</label>
              <input type="number" className="wf-adv-input" placeholder="ex. 100" min="0" value={priceMax} onChange={e => setPriceMax(e.target.value)} onBlur={() => push({ priceMax })} />
            </div>

            <div>
              <label className="wf-adv-label">Rating minim</label>
              <div className="wf-stars">
                {[1,2,3,4,5].map(n => (
                  <span key={n} className={`wf-star ${parseInt(ratingMin) >= n ? 'on' : ''}`}
                    onClick={() => { const v = ratingMin == n ? '' : String(n); setRatingMin(v); push({ ratingMin: v }); }}>★</span>
                ))}
              </div>
            </div>

            <div>
              <label className="wf-adv-label">Favorite</label>
              <button type="button" className={`wf-fav-btn ${isFavorite ? 'on' : ''}`}
                onClick={() => { const v = isFavorite ? '' : 'true'; setIsFavorite(v); push({ isFavorite: v }); }}>
                {isFavorite ? '❤️ Doar favorite' : '🤍 Toate vinurile'}
              </button>
            </div>
          </div>
        )}

        {/* Active tags */}
        {activeTags.length > 0 && (
          <div className="wf-tags">
            {activeTags.map(tag => (
              <div key={tag.key} className="wf-tag">
                <span>{tag.label}</span>
                <span className="wf-tag-x" onClick={tag.clear}>✕</span>
              </div>
            ))}
            <button className="wf-clear" onClick={clearAll}>Șterge tot</button>
          </div>
        )}

        {/* Row 2: sort + page size + count */}
        <div className="wf-row2">
          <div className="wf-row2-left">
            <select className="wf-select" style={{ fontSize: '0.75rem' }} value={sort}
              onChange={e => { setSort(e.target.value); push({ sort: e.target.value }); }}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <select className="wf-select" style={{ fontSize: '0.75rem' }} value={pageSize}
              onChange={e => { setPageSize(e.target.value); push({ pageSize: e.target.value }); }}>
              {PAGE_SIZES.map(n => <option key={n} value={n}>{n} / pagină</option>)}
            </select>
          </div>
          <div className="wf-count">
            <b>{totalResults}</b> {totalResults === 1 ? 'vin' : 'vinuri'}
            {isPending && <span style={{ marginLeft: '0.5rem', color: 'rgba(196,69,105,0.5)' }}>···</span>}
          </div>
        </div>

      </div>
    </>
  );
}
