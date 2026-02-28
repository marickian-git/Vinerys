import Link from 'next/link';
import { getWines } from '@/utils/actions';
import WineCard from '@/components/wines/WineCard';
import WineFilters from '@/components/wines/WineFilters';

export const metadata = {
  title: 'Vinurile mele — Vinerys',
};

export default async function WinesPage({ searchParams }) {
  const params = await searchParams;
  const filters = {
    type:    params.type    || undefined,
    status:  params.status  || undefined,
    country: params.country || undefined,
    search:  params.search  || undefined,
  };

  let wines = [];
  let error = null;

  try {
    wines = await getWines(filters);
  } catch (e) {
    error = e.message;
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .wp-page {
          min-height: 100vh;
          background: #0d0608;
          padding: 6rem 1.5rem 3rem;
          font-family: 'Jost', sans-serif;
        }

        .wp-inner { max-width: 1200px; margin: 0 auto; }

        .wp-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 2.5rem;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .wp-title-area {}
        .wp-eyebrow {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #c44569;
          font-weight: 400;
          margin-bottom: 0.4rem;
        }
        .wp-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300;
          color: #f5e6e8;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .wp-count {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-style: italic;
          color: rgba(245,230,232,0.3);
          margin-top: 0.4rem;
        }

        .wp-add-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8;
          text-decoration: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.3s ease;
          white-space: nowrap;
          box-shadow: 0 2px 12px rgba(196,69,105,0.25);
          flex-shrink: 0;
        }
        .wp-add-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(196,69,105,0.4);
        }

        .wp-divider {
          height: 1px;
          background: linear-gradient(to right, rgba(196,69,105,0.3), transparent);
          margin-bottom: 2rem;
        }

        .wp-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }

        /* Empty state */
        .wp-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 5rem 2rem;
          text-align: center;
          border: 1px dashed rgba(196,69,105,0.2);
          border-radius: 16px;
          background: rgba(255,255,255,0.01);
        }
        .wp-empty-icon {
          font-size: 4rem;
          margin-bottom: 1.5rem;
          opacity: 0.4;
          filter: grayscale(0.3);
        }
        .wp-empty-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.8rem;
          font-weight: 300;
          color: #f5e6e8;
          margin-bottom: 0.5rem;
        }
        .wp-empty-sub {
          font-size: 0.82rem;
          color: rgba(245,230,232,0.35);
          font-weight: 300;
          margin-bottom: 2rem;
          max-width: 320px;
          line-height: 1.7;
        }
        .wp-empty-btn {
          padding: 0.65rem 1.5rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8;
          text-decoration: none;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          transition: all 0.3s;
          box-shadow: 0 2px 12px rgba(196,69,105,0.25);
        }
        .wp-empty-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(196,69,105,0.4);
        }

        /* Error state */
        .wp-error {
          grid-column: 1 / -1;
          padding: 2rem;
          border: 1px solid rgba(196,69,105,0.3);
          border-radius: 12px;
          background: rgba(139,26,46,0.1);
          color: rgba(245,230,232,0.7);
          font-size: 0.85rem;
          text-align: center;
        }

        @media (max-width: 640px) {
          .wp-page { padding: 5rem 1rem 2rem; }
          .wp-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem; }
          .wp-header { flex-direction: column; align-items: flex-start; }
          .wp-add-btn { width: 100%; justify-content: center; }
        }
      `}</style>

      <div className="wp-page">
        <div className="wp-inner">
          <div className="wp-header">
            <div className="wp-title-area">
              <p className="wp-eyebrow">Colecția mea</p>
              <h1 className="wp-title">Pivnița digitală</h1>
              {wines.length > 0 && (
                <p className="wp-count">{wines.length} {wines.length === 1 ? 'vin' : 'vinuri'} în colecție</p>
              )}
            </div>
            <Link href="/wines/add" className="wp-add-btn">
              + Adaugă vin
            </Link>
          </div>

          <div className="wp-divider" />

          <WineFilters activeFilters={filters} />

          <div className="wp-grid">
            {error ? (
              <div className="wp-error">Eroare la încărcarea vinurilor: {error}</div>
            ) : wines.length === 0 ? (
              <div className="wp-empty">
                <div className="wp-empty-icon">🍷</div>
                <h2 className="wp-empty-title">
                  {Object.values(filters).some(Boolean)
                    ? 'Niciun vin găsit'
                    : 'Pivnița e goală'}
                </h2>
                <p className="wp-empty-sub">
                  {Object.values(filters).some(Boolean)
                    ? 'Încearcă să modifici filtrele pentru a găsi vinuri.'
                    : 'Începe să-ți construiești colecția adăugând primul tău vin.'}
                </p>
                {!Object.values(filters).some(Boolean) && (
                  <Link href="/wines/add" className="wp-empty-btn">
                    Adaugă primul vin
                  </Link>
                )}
              </div>
            ) : (
              wines.map((wine) => <WineCard key={wine.id} wine={wine} />)
            )}
          </div>
        </div>
      </div>
    </>
  );
}
