import { getWines, getWineCountries } from '@/utils/actions';
import WineCard from '@/components/wines/WineCard';
import WineFilters from '@/components/wines/WineFilters';
import Link from 'next/link';

export const metadata = { title: 'Colecția mea — Vinerys' };

function Pagination({ page, totalPages, searchParams }) {
  if (totalPages <= 1) return null;

  const buildUrl = (p) => {
    const sp = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v).map(([k, v]) => [k, String(v)])
    );
    sp.set('page', p);
    return `/wines?${sp.toString()}`;
  };

  const pages = [];
  const delta = 2;
  const left  = Math.max(1, page - delta);
  const right = Math.min(totalPages, page + delta);
  for (let i = left; i <= right; i++) pages.push(i);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400&display=swap');
        .pg-wrap { display: flex; align-items: center; justify-content: center; gap: 0.4rem; margin-top: 3rem; flex-wrap: wrap; font-family: 'Jost', sans-serif; }
        .pg-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 0.82rem; border: 1px solid rgba(196,69,105,0.15); color: rgba(245,230,232,0.45); text-decoration: none; transition: all 0.2s; background: rgba(255,255,255,0.02); }
        .pg-btn:hover { border-color: rgba(196,69,105,0.4); color: rgba(245,230,232,0.85); background: rgba(196,69,105,0.07); }
        .pg-btn.active { background: linear-gradient(135deg, #8b1a2e, #c44569); border-color: transparent; color: #f5e6e8; }
        .pg-btn.off { opacity: 0.2; pointer-events: none; }
        .pg-dots { color: rgba(245,230,232,0.2); font-size: 0.75rem; padding: 0 0.2rem; }
        .pg-info { font-size: 0.68rem; color: rgba(245,230,232,0.2); letter-spacing: 0.08em; margin-left: 0.5rem; }
      `}</style>
      <nav className="pg-wrap">
        <Link href={buildUrl(page - 1)} className={`pg-btn ${page <= 1 ? 'off' : ''}`}>←</Link>

        {left > 1 && <>
          <Link href={buildUrl(1)} className="pg-btn">1</Link>
          {left > 2 && <span className="pg-dots">···</span>}
        </>}

        {pages.map(p => (
          <Link key={p} href={buildUrl(p)} className={`pg-btn ${p === page ? 'active' : ''}`}>{p}</Link>
        ))}

        {right < totalPages && <>
          {right < totalPages - 1 && <span className="pg-dots">···</span>}
          <Link href={buildUrl(totalPages)} className="pg-btn">{totalPages}</Link>
        </>}

        <Link href={buildUrl(page + 1)} className={`pg-btn ${page >= totalPages ? 'off' : ''}`}>→</Link>
        <span className="pg-info">pagina {page} din {totalPages}</span>
      </nav>
    </>
  );
}

export default async function WinesPage({ searchParams }) {
  const sp = await searchParams;

  const filters = {
    search:     sp.search     || '',
    type:       sp.type       || '',
    status:     sp.status     || '',
    country:    sp.country    || '',
    sort:       sp.sort       || 'newest',
    page:       sp.page       || '1',
    pageSize:   sp.pageSize   || '24',
    vintageMin: sp.vintageMin || '',
    vintageMax: sp.vintageMax || '',
    ratingMin:  sp.ratingMin  || '',
    priceMax:   sp.priceMax   || '',
    isFavorite: sp.isFavorite || '',
  };

  let result = { wines: [], total: 0, page: 1, pageSize: 24, totalPages: 0 };
  let countries = [];
  let error = null;

  try {
    [result, countries] = await Promise.all([
      getWines(filters),
      getWineCountries(),
    ]);
  } catch (err) {
    error = err.message;
  }

  const { wines, total, page, totalPages } = result;
  const hasActiveFilters = Object.entries(filters).some(([k, v]) => v && !['sort', 'pageSize', 'page'].includes(k));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;600&family=Jost:wght@300;400;500&display=swap');
        .wl-page { min-height: 100vh; background: #0d0608; padding: 6rem 1.5rem 4rem; font-family: 'Jost', sans-serif; }
        .wl-inner { max-width: 1200px; margin: 0 auto; }
        .wl-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem; }
        .wl-eyebrow { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.2em; color: #c44569; margin-bottom: 0.3rem; }
        .wl-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 3vw, 2.8rem); font-weight: 300; color: #f5e6e8; line-height: 1; }
        .wl-btn-add {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.7rem 1.35rem; background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8; text-decoration: none; border-radius: 10px;
          font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          transition: all 0.25s; box-shadow: 0 4px 16px rgba(196,69,105,0.25); white-space: nowrap;
        }
        .wl-btn-add:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(196,69,105,0.4); }
        .wl-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.25rem; }
        .wl-empty { text-align: center; padding: 5rem 2rem; }
        .wl-empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
        .wl-empty-title { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 300; color: rgba(245,230,232,0.45); margin-bottom: 0.5rem; }
        .wl-empty-sub { font-size: 0.82rem; color: rgba(245,230,232,0.25); font-weight: 300; margin-bottom: 2rem; }
        .wl-btn-empty { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.7rem 1.35rem; background: linear-gradient(135deg, #8b1a2e, #c44569); color: #f5e6e8; text-decoration: none; border-radius: 10px; font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; }
        .wl-error { padding: 1.25rem 1.5rem; border-radius: 10px; background: rgba(220,80,80,0.08); border: 1px solid rgba(220,80,80,0.2); color: rgba(220,80,80,0.8); font-size: 0.85rem; font-weight: 300; }
        @media (max-width: 640px) { .wl-page { padding: 5rem 1rem 3rem; } }
      `}</style>

      <div className="wl-page">
        <div className="wl-inner">
          <div className="wl-header">
            <div>
              <p className="wl-eyebrow">Colecție</p>
              <h1 className="wl-title">Pivnița digitală</h1>
            </div>
            <Link href="/wines/add" className="wl-btn-add">+ Adaugă vin</Link>
          </div>

          <WineFilters countries={countries} totalResults={total} />

          {error ? (
            <div className="wl-error">⚠️ {error}</div>
          ) : wines.length === 0 ? (
            <div className="wl-empty">
              <div className="wl-empty-icon">🍷</div>
              <h2 className="wl-empty-title">
                {hasActiveFilters ? 'Niciun vin nu corespunde filtrelor' : 'Colecția ta e goală'}
              </h2>
              <p className="wl-empty-sub">
                {hasActiveFilters ? 'Modifică sau șterge filtrele active.' : 'Adaugă primul vin în pivnița ta digitală.'}
              </p>
              {!hasActiveFilters && <Link href="/wines/add" className="wl-btn-empty">🍷 Adaugă primul vin</Link>}
            </div>
          ) : (
            <>
              <div className="wl-grid">
                {wines.map(wine => <WineCard key={wine.id} wine={wine} />)}
              </div>
              <Pagination page={page} totalPages={totalPages} searchParams={sp} />
            </>
          )}
        </div>
      </div>
    </>
  );
}
