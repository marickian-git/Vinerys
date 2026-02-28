import { getWineById } from '@/utils/actions';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import WineActions from '@/components/wines/WineActions';

export async function generateMetadata({ params }) {
const { id } = await params;

  try {
    const wine = await getWineById(id);
    return { title: `${wine.name} — Vinerys` };
  } catch {
    return { title: 'Vin — Vinerys' };
  }
}

const TYPE_CONFIG = {
  RED:       { label: 'Roșu',      dot: '#8b1a2e', bg: 'rgba(139,26,46,0.2)' },
  WHITE:     { label: 'Alb',       dot: '#d4af37', bg: 'rgba(212,175,55,0.15)' },
  ROSE:      { label: 'Roze',      dot: '#c44569', bg: 'rgba(196,69,105,0.2)' },
  SPARKLING: { label: 'Spumant',   dot: '#b4c8dc', bg: 'rgba(180,200,220,0.12)' },
  DESSERT:   { label: 'Desert',    dot: '#b47828', bg: 'rgba(180,120,40,0.15)' },
  FORTIFIED: { label: 'Fortifiat', dot: '#643078', bg: 'rgba(100,40,120,0.15)' },
};

const STATUS_CONFIG = {
  IN_CELLAR: { label: 'În pivniță', color: 'rgba(85,196,78,0.8)' },
  CONSUMED:  { label: 'Consumat',   color: 'rgba(245,230,232,0.3)' },
  SOLD:      { label: 'Vândut',     color: 'rgba(212,175,55,0.7)' },
  GIFTED:    { label: 'Dăruit',     color: 'rgba(196,69,105,0.7)' },
};

function InfoRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div className="wd-info-row">
      <span className="wd-info-label">{label}</span>
      <span className="wd-info-value">{value}</span>
    </div>
  );
}

export default async function WineDetailPage({ params }) {
  const { id } = await params;

  let wine;
  try {

    wine = await getWineById(id);
  } catch {
    notFound();
  }

  const type   = TYPE_CONFIG[wine.type]   ?? TYPE_CONFIG.RED;
  const status = STATUS_CONFIG[wine.status] ?? STATUS_CONFIG.IN_CELLAR;
  const stars  = Array.from({ length: 5 }, (_, i) => i < (wine.rating ?? 0));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Jost:wght@300;400;500&display=swap');

        .wd-page {
          min-height: 100vh;
          background: #0d0608;
          padding: 6rem 1.5rem 4rem;
          font-family: 'Jost', sans-serif;
        }
        .wd-inner { max-width: 1000px; margin: 0 auto; }

        .wd-back {
          display: inline-flex; align-items: center; gap: 0.4rem;
          font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em;
          color: rgba(245,230,232,0.3); text-decoration: none;
          margin-bottom: 2rem; transition: color 0.2s;
        }
        .wd-back:hover { color: rgba(245,230,232,0.65); }

        /* Hero */
        .wd-hero {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 2.5rem;
          margin-bottom: 3rem;
          align-items: start;
        }

        .wd-image-wrap {
          position: sticky;
          top: 5rem;
        }
        .wd-image {
          aspect-ratio: 3/4;
          background: linear-gradient(160deg, rgba(26,8,16,0.95), rgba(13,6,8,0.98));
          border: 1px solid rgba(196,69,105,0.12);
          border-radius: 16px;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
          position: relative;
        }
        .wd-image-glow {
          position: absolute; inset: 0;
          background: radial-gradient(ellipse at 50% 30%, rgba(139,26,46,0.25), transparent 70%);
        }
        .wd-image-icon { font-size: 5rem; position: relative; z-index: 1; filter: drop-shadow(0 6px 20px rgba(196,69,105,0.3)); }
        .wd-image img { width: 100%; height: 100%; object-fit: cover; }

        .wd-info {}
        .wd-badges {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
          margin-bottom: 1rem;
        }
        .wd-badge {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.25rem 0.7rem;
          border-radius: 20px;
          font-size: 0.65rem; font-weight: 500;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(245,230,232,0.85);
        }
        .wd-badge-dot { width: 6px; height: 6px; border-radius: 50%; }

        .wd-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300;
          color: #f5e6e8;
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 0.4rem;
        }
        .wd-producer {
          font-size: 0.88rem;
          color: rgba(245,230,232,0.4);
          font-weight: 300;
          letter-spacing: 0.06em;
          margin-bottom: 1.25rem;
        }

        .wd-stars { display: flex; gap: 3px; margin-bottom: 1.5rem; }
        .wd-star { font-size: 1.1rem; }
        .wd-star-fill { color: #d4af37; }
        .wd-star-empty { color: rgba(245,230,232,0.12); }

        .wd-quick-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(196,69,105,0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 2rem;
        }
        .wd-qs-item {
          background: rgba(255,255,255,0.02);
          padding: 1rem;
          text-align: center;
        }
        .wd-qs-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: #f5e6e8;
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .wd-qs-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(245,230,232,0.3);
          font-weight: 400;
        }

        .wd-actions-row {
          display: flex; gap: 0.75rem; flex-wrap: wrap;
        }

        /* Sections */
        .wd-sections {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
        }
        .wd-section-full { grid-column: 1 / -1; }

        .wd-section {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(196,69,105,0.08);
          border-radius: 12px;
          padding: 1.5rem;
        }
        .wd-section-title {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #c44569;
          font-weight: 400;
          margin-bottom: 1.1rem;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid rgba(196,69,105,0.1);
        }

        .wd-info-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 1rem;
          padding: 0.5rem 0;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }
        .wd-info-row:last-child { border-bottom: none; padding-bottom: 0; }
        .wd-info-label {
          font-size: 0.75rem;
          color: rgba(245,230,232,0.35);
          font-weight: 300;
          flex-shrink: 0;
        }
        .wd-info-value {
          font-size: 0.82rem;
          color: rgba(245,230,232,0.75);
          text-align: right;
          font-weight: 400;
        }

        .wd-tasting-notes {
          font-size: 0.85rem;
          color: rgba(245,230,232,0.6);
          font-weight: 300;
          line-height: 1.8;
          font-style: italic;
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
        }

        .wd-tags {
          display: flex; gap: 0.5rem; flex-wrap: wrap;
        }
        .wd-tag {
          padding: 0.25rem 0.65rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15);
          border-radius: 20px;
          font-size: 0.72rem;
          color: rgba(245,230,232,0.55);
          font-weight: 300;
        }

        .wd-price-big {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem;
          font-weight: 600;
          color: rgba(212,175,55,0.85);
          line-height: 1;
        }

        @media (max-width: 768px) {
          .wd-hero { grid-template-columns: 1fr; }
          .wd-image-wrap { position: static; }
          .wd-image { aspect-ratio: 16/9; max-height: 200px; }
          .wd-sections { grid-template-columns: 1fr; }
          .wd-section-full { grid-column: 1; }
          .wd-quick-stats { grid-template-columns: repeat(3,1fr); }
        }
        @media (max-width: 480px) {
          .wd-page { padding: 5rem 1rem 3rem; }
          .wd-quick-stats { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="wd-page">
        <div className="wd-inner">
          <Link href="/wines" className="wd-back">← Înapoi la colecție</Link>

          {/* Hero */}
          <div className="wd-hero">
            <div className="wd-image-wrap">
              <div className="wd-image">
                <div className="wd-image-glow" />
                {wine.labelImageUrl || wine.bottleImageUrl ? (
                  <img src={wine.labelImageUrl || wine.bottleImageUrl} alt={wine.name} />
                ) : (
                  <span className="wd-image-icon">🍷</span>
                )}
              </div>
            </div>

            <div className="wd-info">
              <div className="wd-badges">
                <div className="wd-badge" style={{ background: type.bg, border: `1px solid ${type.dot}40` }}>
                  <div className="wd-badge-dot" style={{ background: type.dot }} />
                  {type.label}
                </div>
                <div className="wd-badge" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="wd-badge-dot" style={{ background: status.color }} />
                  <span style={{ color: status.color }}>{status.label}</span>
                </div>
                {wine.isFavorite && (
                  <div className="wd-badge" style={{ background: 'rgba(196,69,105,0.1)', border: '1px solid rgba(196,69,105,0.25)' }}>
                    ❤️ Favorit
                  </div>
                )}
              </div>

              <h1 className="wd-name">{wine.name}</h1>
              <p className="wd-producer">
                {[wine.producer, wine.region, wine.country].filter(Boolean).join(' · ') || 'Producător necunoscut'}
              </p>

              {wine.rating && (
                <div className="wd-stars">
                  {stars.map((filled, i) => (
                    <span key={i} className={`wd-star ${filled ? 'wd-star-fill' : 'wd-star-empty'}`}>★</span>
                  ))}
                  <span style={{ fontSize: '0.78rem', color: 'rgba(245,230,232,0.3)', marginLeft: '0.4rem', alignSelf: 'center' }}>{wine.rating}/5</span>
                </div>
              )}

              <div className="wd-quick-stats">
                <div className="wd-qs-item">
                  <div className="wd-qs-value">{wine.vintage ?? '—'}</div>
                  <div className="wd-qs-label">An recoltă</div>
                </div>
                <div className="wd-qs-item">
                  <div className="wd-qs-value">{wine.quantity}</div>
                  <div className="wd-qs-label">Sticle</div>
                </div>
                <div className="wd-qs-item">
                  <div className="wd-qs-value">{wine.alcoholPercentage ? `${wine.alcoholPercentage}%` : '—'}</div>
                  <div className="wd-qs-label">Alcool</div>
                </div>
              </div>

              <div className="wd-actions-row">
                <WineActions wineId={wine.id} isFavorite={wine.isFavorite} />
              </div>
            </div>
          </div>

          {/* Detail sections */}
          <div className="wd-sections">
            {/* Informații */}
            <div className="wd-section">
              <div className="wd-section-title">Informații</div>
              <InfoRow label="Producător" value={wine.producer} />
              <InfoRow label="Țară" value={wine.country} />
              <InfoRow label="Regiune" value={wine.region} />
              <InfoRow label="Subregiune" value={wine.subregion} />
              <InfoRow label="An recoltă" value={wine.vintage} />
              <InfoRow label="Mărime sticlă" value={wine.bottleSize} />
              <InfoRow label="Temperatură servire" value={wine.servingTemperature} />
              <InfoRow label="Potențial maturare" value={wine.agingPotential} />
            </div>

            {/* Preț & Stocare */}
            <div className="wd-section">
              <div className="wd-section-title">Preț & Stocare</div>
              {wine.purchasePrice && (
                <div style={{ marginBottom: '1rem' }}>
                  <div className="wd-price-big">{wine.purchasePrice} €</div>
                  <div style={{ fontSize: '0.68rem', color: 'rgba(245,230,232,0.3)', marginTop: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Preț achiziție</div>
                </div>
              )}
              <InfoRow label="Valoare estimată" value={wine.estimatedValue ? `${wine.estimatedValue} €` : null} />
              <InfoRow label="Data achiziției" value={wine.purchaseDate ? new Date(wine.purchaseDate).toLocaleDateString('ro-RO') : null} />
              <InfoRow label="Locație pivniță" value={wine.cellarLocation} />
              <InfoRow label="Cantitate" value={`${wine.quantity} ${wine.quantity === 1 ? 'sticlă' : 'sticle'}`} />
            </div>

            {/* Soiuri & Gastronomie */}
            {(wine.grapeVarieties?.length > 0 || wine.foodPairing?.length > 0) && (
              <div className="wd-section">
                <div className="wd-section-title">Soiuri & Gastronomie</div>
                {wine.grapeVarieties?.length > 0 && (
                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(245,230,232,0.3)', marginBottom: '0.5rem' }}>Soiuri de struguri</div>
                    <div className="wd-tags">
                      {wine.grapeVarieties.map(g => <span key={g} className="wd-tag">{g}</span>)}
                    </div>
                  </div>
                )}
                {wine.foodPairing?.length > 0 && (
                  <div>
                    <div style={{ fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'rgba(245,230,232,0.3)', marginBottom: '0.5rem' }}>Asocieri gastronomice</div>
                    <div className="wd-tags">
                      {wine.foodPairing.map(f => <span key={f} className="wd-tag">{f}</span>)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notițe degustare */}
            {wine.tastingNotes && (
              <div className="wd-section">
                <div className="wd-section-title">Notițe de degustare</div>
                <p className="wd-tasting-notes">"{wine.tastingNotes}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
