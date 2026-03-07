import Link from 'next/link';
import prisma from '@/utils/db';
import WineCard from '@/components/wines/WineCard';

export async function generateMetadata({ params }) {
  const { shareId } = await params;
  const user = await prisma.user.findUnique({
    where: { shareId },
    select: { cellarName: true, name: true },
  });
  if (!user) return { title: 'Colecție — Vinerys' };
  return { title: `${user.cellarName || user.name + "'s Collection"} — Vinerys` };
}

const TYPE_LABELS = { RED: 'Roșu', WHITE: 'Alb', ROSE: 'Roze', SPARKLING: 'Spumant', DESSERT: 'Desert', FORTIFIED: 'Fortifiat' };
const TYPE_COLORS = { RED: '#8b1a2e', WHITE: '#d4af37', ROSE: '#c44569', SPARKLING: '#b4c8dc', DESSERT: '#b47828', FORTIFIED: '#643078' };

export default async function PublicCollectionPage({ params }) {
  const { shareId } = await params;

  const user = await prisma.user.findUnique({
    where: { shareId },
    select: { id: true, name: true, cellarName: true, createdAt: true },
  });

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d0608', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <div style={{ textAlign: 'center', color: 'rgba(245,230,232,0.4)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🍷</div>
          <p>Această colecție nu există sau nu mai este disponibilă.</p>
          <Link href="/" style={{ color: '#c44569', fontSize: '0.85rem', marginTop: '1rem', display: 'block' }}>← Vinerys</Link>
        </div>
      </div>
    );
  }

  const wines = await prisma.wine.findMany({
    where: { userId: user.id, status: 'IN_CELLAR' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, producer: true, country: true, region: true,
      type: true, color: true, vintage: true, grapeVarieties: true,
      quantity: true, rating: true, tastingNotes: true,
      bottleSize: true, bottleImageUrl: true, labelImageUrl: true,
      isFavorite: true, status: true,
      // Câmpuri private — excluse: purchasePrice, estimatedValue, cellarLocation
    },
  });

  const totalBottles = wines.reduce((s, w) => s + (w.quantity || 1), 0);
  const byType = wines.reduce((acc, w) => { acc[w.type] = (acc[w.type] ?? 0) + 1; return acc; }, {});
  const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
  const countries = [...new Set(wines.map(w => w.country).filter(Boolean))];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0d0608; }

        .pub-page { min-height: 100vh; background: #0d0608; font-family: 'Jost', sans-serif; }

        /* Hero */
        .pub-hero {
          background: linear-gradient(180deg, rgba(139,26,46,0.15) 0%, transparent 100%);
          border-bottom: 1px solid rgba(196,69,105,0.1);
          padding: 4rem 1.5rem 3rem;
          text-align: center;
        }
        .pub-badge {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.2em;
          color: rgba(196,69,105,0.7); background: rgba(196,69,105,0.08);
          border: 1px solid rgba(196,69,105,0.15); border-radius: 20px;
          padding: 0.3rem 0.8rem; margin-bottom: 1.25rem;
        }
        .pub-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2.5rem, 6vw, 4.5rem);
          font-weight: 300; color: #f5e6e8; line-height: 1;
          letter-spacing: -0.02em; margin-bottom: 0.5rem;
        }
        .pub-subtitle { font-size: 0.85rem; color: rgba(245,230,232,0.35); font-weight: 300; }

        /* Stats */
        .pub-stats {
          display: flex; justify-content: center; gap: 3rem;
          margin-top: 2.5rem; flex-wrap: wrap;
        }
        .pub-stat { text-align: center; }
        .pub-stat-val {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 600; color: #f5e6e8; line-height: 1;
        }
        .pub-stat-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245,230,232,0.3); margin-top: 0.3rem; }

        /* Type bars */
        .pub-types {
          display: flex; justify-content: center; gap: 0.5rem;
          margin-top: 2rem; flex-wrap: wrap;
        }
        .pub-type-pill {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.3rem 0.75rem; border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          font-size: 0.72rem; color: rgba(245,230,232,0.5);
        }
        .pub-type-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }

        /* Content */
        .pub-content { max-width: 1200px; margin: 0 auto; padding: 3rem 1.5rem 5rem; }

        .pub-section-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.5rem;
        }
        .pub-section-title {
          font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.2em;
          color: #c44569; font-weight: 400;
        }
        .pub-count { font-size: 0.68rem; color: rgba(245,230,232,0.25); }

        .pub-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }

        /* Footer */
        .pub-footer {
          text-align: center; padding: 2rem;
          border-top: 1px solid rgba(196,69,105,0.08);
          font-size: 0.72rem; color: rgba(245,230,232,0.2);
        }
        .pub-footer a { color: rgba(196,69,105,0.5); text-decoration: none; }
        .pub-footer a:hover { color: #c44569; }

        /* Readonly overlay on cards — disable actions */
        .pub-grid a[href*="/wines/"] { pointer-events: none; }

        @media (max-width: 640px) {
          .pub-hero { padding: 3rem 1rem 2rem; }
          .pub-content { padding: 2rem 1rem 3rem; }
          .pub-stats { gap: 2rem; }
        }
      `}</style>

      <div className="pub-page">
        <div className="pub-hero">
          <div className="pub-badge">🍷 Colecție publică</div>
          <h1 className="pub-title">{user.cellarName || `Colecția lui ${user.name}`}</h1>
          <p className="pub-subtitle">
            {countries.length > 0 ? `${countries.slice(0, 3).join(', ')}${countries.length > 3 ? ` și alte ${countries.length - 3} țări` : ''}` : 'O colecție de vinuri aleasă cu grijă'}
          </p>

          <div className="pub-stats">
            <div className="pub-stat">
              <div className="pub-stat-val">{wines.length}</div>
              <div className="pub-stat-label">Vinuri unice</div>
            </div>
            <div className="pub-stat">
              <div className="pub-stat-val">{totalBottles}</div>
              <div className="pub-stat-label">Sticle în pivniță</div>
            </div>
            <div className="pub-stat">
              <div className="pub-stat-val">{countries.length}</div>
              <div className="pub-stat-label">Țări</div>
            </div>
            {topType && (
              <div className="pub-stat">
                <div className="pub-stat-val">{TYPE_LABELS[topType[0]]}</div>
                <div className="pub-stat-label">Tipul preferat</div>
              </div>
            )}
          </div>

          {Object.keys(byType).length > 0 && (
            <div className="pub-types">
              {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => (
                <div key={type} className="pub-type-pill">
                  <div className="pub-type-dot" style={{ background: TYPE_COLORS[type] ?? '#c44569' }} />
                  {TYPE_LABELS[type] ?? type} · {count}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pub-content">
          <div className="pub-section-header">
            <span className="pub-section-title">Vinuri în pivniță</span>
            <span className="pub-count">{wines.length} vinuri</span>
          </div>

          {wines.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(245,230,232,0.2)', fontSize: '0.85rem' }}>
              Această colecție este goală momentan.
            </div>
          ) : (
            <div className="pub-grid">
              {wines.map(wine => <WineCard key={wine.id} wine={wine} readonly />)}
            </div>
          )}
        </div>

        <div className="pub-footer">
          <p>Colecție gestionată cu <a href="/">Vinerys</a> · Îți place? <a href="/sign-up">Creează-ți propria pivniță digitală</a></p>
        </div>
      </div>
    </>
  );
}