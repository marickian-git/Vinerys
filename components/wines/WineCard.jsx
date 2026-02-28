'use client';

import Link from 'next/link';

const TYPE_CONFIG = {
  RED:       { bg: 'rgba(139,26,46,0.25)',  border: 'rgba(139,26,46,0.5)',   dot: '#8b1a2e', label: 'Roșu' },
  WHITE:     { bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.4)',  dot: '#d4af37', label: 'Alb' },
  ROSE:      { bg: 'rgba(196,69,105,0.2)',  border: 'rgba(196,69,105,0.45)', dot: '#c44569', label: 'Roze' },
  SPARKLING: { bg: 'rgba(180,200,220,0.12)',border: 'rgba(180,200,220,0.3)', dot: '#b4c8dc', label: 'Spumant' },
  DESSERT:   { bg: 'rgba(180,120,40,0.15)', border: 'rgba(180,120,40,0.35)', dot: '#b47828', label: 'Desert' },
  FORTIFIED: { bg: 'rgba(100,40,120,0.15)', border: 'rgba(100,40,120,0.35)', dot: '#643078', label: 'Fortifiat' },
};

const STATUS_CONFIG = {
  IN_CELLAR: { label: 'În pivniță', color: 'rgba(85,196,78,0.8)' },
  CONSUMED:  { label: 'Consumat',   color: 'rgba(245,230,232,0.3)' },
  SOLD:      { label: 'Vândut',     color: 'rgba(212,175,55,0.7)' },
  GIFTED:    { label: 'Dăruit',     color: 'rgba(196,69,105,0.7)' },
};

export default function WineCard({ wine }) {
  const type   = TYPE_CONFIG[wine.type]   ?? TYPE_CONFIG.RED;
  const status = STATUS_CONFIG[wine.status] ?? STATUS_CONFIG.IN_CELLAR;
  const stars  = Array.from({ length: 5 }, (_, i) => i < (wine.rating ?? 0));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .wc-card {
          position: relative;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(196,69,105,0.1);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.3s ease;
          text-decoration: none;
          display: block;
          font-family: 'Jost', sans-serif;
        }
        .wc-card:hover {
          border-color: rgba(196,69,105,0.3);
          background: rgba(255,255,255,0.05);
          transform: translateY(-3px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(196,69,105,0.15);
        }

        .wc-image {
          position: relative;
          height: 180px;
          background: linear-gradient(160deg, rgba(26,8,16,0.9), rgba(13,6,8,0.95));
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .wc-image-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse at 50% 30%, rgba(139,26,46,0.2), transparent 70%);
        }
        .wc-bottle-icon {
          font-size: 3.5rem;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 4px 12px rgba(196,69,105,0.3));
        }
        .wc-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; }

        .wc-type-badge {
          position: absolute;
          top: 0.75rem; left: 0.75rem;
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.25rem 0.6rem;
          border-radius: 20px;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245,230,232,0.9);
          z-index: 2;
        }
        .wc-type-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .wc-favorite { position: absolute; top: 0.75rem; right: 0.75rem; font-size: 1rem; z-index: 2; }

        .wc-body { padding: 1rem 1.1rem 1.1rem; }

        .wc-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: #f5e6e8;
          line-height: 1.25;
          margin-bottom: 0.2rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wc-producer {
          font-size: 0.75rem;
          color: rgba(245,230,232,0.4);
          font-weight: 300;
          letter-spacing: 0.05em;
          margin-bottom: 0.75rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wc-meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.85rem; }
        .wc-meta-item { font-size: 0.7rem; color: rgba(245,230,232,0.35); font-weight: 300; }
        .wc-meta-sep { width: 3px; height: 3px; border-radius: 50%; background: rgba(196,69,105,0.4); flex-shrink: 0; }

        .wc-footer { display: flex; align-items: center; justify-content: space-between; }
        .wc-stars { display: flex; gap: 2px; }
        .wc-star { font-size: 0.7rem; line-height: 1; color: #d4af37; }
        .wc-star-empty { color: rgba(245,230,232,0.15); }
        .wc-no-rating { font-size: 0.7rem; color: rgba(245,230,232,0.2); }

        .wc-right { display: flex; align-items: center; gap: 0.6rem; }
        .wc-price { font-family: 'Cormorant Garamond', serif; font-size: 1rem; font-weight: 600; color: rgba(212,175,55,0.85); }
        .wc-status { font-size: 0.62rem; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.2rem 0.5rem; border-radius: 4px; background: rgba(255,255,255,0.04); }

        .wc-qty {
          position: absolute;
          top: 0.75rem; right: 0.75rem;
          font-size: 0.65rem;
          color: rgba(245,230,232,0.35);
          background: rgba(0,0,0,0.4);
          padding: 0.15rem 0.4rem;
          border-radius: 4px;
          font-family: 'Jost', sans-serif;
          z-index: 2;
        }
      `}</style>

      <Link href={`/wines/${wine.id}`} className="wc-card">
        <div className="wc-image">
          <div className="wc-image-bg" />
          {wine.labelImageUrl || wine.bottleImageUrl ? (
            <img src={wine.labelImageUrl || wine.bottleImageUrl} alt={wine.name} className="wc-img" />
          ) : (
            <span className="wc-bottle-icon">🍷</span>
          )}
          <div className="wc-type-badge" style={{ background: type.bg, border: `1px solid ${type.border}` }}>
            <div className="wc-type-dot" style={{ background: type.dot }} />
            {type.label}
          </div>
          {wine.isFavorite && <div className="wc-favorite">❤️</div>}
          {wine.quantity > 1 && <div className="wc-qty">×{wine.quantity}</div>}
        </div>

        <div className="wc-body">
          <div className="wc-name">{wine.name}</div>
          <div className="wc-producer">
            {[wine.producer, wine.region, wine.country].filter(Boolean).join(' · ') || 'Producător necunoscut'}
          </div>

          <div className="wc-meta">
            {wine.vintage && <span className="wc-meta-item">{wine.vintage}</span>}
            {wine.vintage && wine.alcoholPercentage && <div className="wc-meta-sep" />}
            {wine.alcoholPercentage && <span className="wc-meta-item">{wine.alcoholPercentage}% alc.</span>}
            {wine.alcoholPercentage && wine.bottleSize && <div className="wc-meta-sep" />}
            {wine.bottleSize && <span className="wc-meta-item">{wine.bottleSize}</span>}
          </div>

          <div className="wc-footer">
            <div className="wc-stars">
              {wine.rating
                ? stars.map((filled, i) => (
                    <span key={i} className={`wc-star ${filled ? '' : 'wc-star-empty'}`}>★</span>
                  ))
                : <span className="wc-no-rating">Neevaluat</span>
              }
            </div>
            <div className="wc-right">
              {wine.purchasePrice && <span className="wc-price">{wine.purchasePrice} €</span>}
              <span className="wc-status" style={{ color: status.color }}>{status.label}</span>
            </div>
          </div>
        </div>
      </Link>
    </>
  );
}
