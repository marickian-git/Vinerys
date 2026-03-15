'use client';

// Categorii de arome cu culori
const AROMA_CATEGORIES = {
  fructe: {
    label: 'Fructe',
    color: 'rgba(196,69,105,0.8)',
    bg: 'rgba(196,69,105,0.08)',
    border: 'rgba(196,69,105,0.2)',
    keywords: ['cireșe', 'fructe roșii', 'fructe negre', 'zmeură', 'afine', 'prune', 'coacăze',
      'citrice', 'mere', 'pere', 'piersici', 'caise', 'ananas', 'lămâie', 'portocale', 'grapefruit'],
  },
  flori: {
    label: 'Flori',
    color: 'rgba(180,100,200,0.8)',
    bg: 'rgba(180,100,200,0.08)',
    border: 'rgba(180,100,200,0.2)',
    keywords: ['flori albe', 'trandafiri', 'violete', 'lavandă', 'iasomie', 'flori de câmp'],
  },
  lemn: {
    label: 'Lemn & Condimente',
    color: 'rgba(180,120,60,0.8)',
    bg: 'rgba(180,120,60,0.08)',
    border: 'rgba(180,120,60,0.2)',
    keywords: ['vanilie', 'cedru', 'stejar', 'tutun', 'cafea', 'ciocolată',
      'piper negru', 'scorțișoară', 'cuișoare', 'mentă', 'eucalipt', 'anason'],
  },
  pamant: {
    label: 'Pământ & Minerale',
    color: 'rgba(120,100,70,0.8)',
    bg: 'rgba(120,100,70,0.08)',
    border: 'rgba(120,100,70,0.2)',
    keywords: ['pământ', 'minerale', 'piatră', 'piele', 'gudron', 'trufe', 'humus', 'fum'],
  },
  altele: {
    label: 'Altele',
    color: 'rgba(180,180,180,0.6)',
    bg: 'rgba(180,180,180,0.05)',
    border: 'rgba(180,180,180,0.15)',
    keywords: [],
  },
};

function getCategory(aroma) {
  const lower = aroma.toLowerCase();
  for (const [key, cat] of Object.entries(AROMA_CATEGORIES)) {
    if (key === 'altele') continue;
    if (cat.keywords.some(k => lower.includes(k) || k.includes(lower))) {
      return cat;
    }
  }
  return AROMA_CATEGORIES.altele;
}

export default function AromaProfile({ aromas = [], compact = false }) {
  if (!aromas || aromas.length === 0) return null;

  if (compact) {
    const visible = aromas.slice(0, 4);
    const rest = aromas.length - 4;
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
        {visible.map(aroma => {
          const cat = getCategory(aroma);
          return (
            <span key={aroma} style={{
              padding: '0.12rem 0.45rem', borderRadius: '20px',
              background: cat.bg, border: `1px solid ${cat.border}`,
              fontSize: '0.6rem', color: cat.color,
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              letterSpacing: '0.02em',
            }}>
              {aroma}
            </span>
          );
        })}
        {rest > 0 && (
          <span style={{
            padding: '0.12rem 0.45rem', borderRadius: '20px',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
            fontSize: '0.6rem', color: 'rgba(245,230,232,0.25)',
            fontFamily: "'Jost', sans-serif",
          }}>
            +{rest}
          </span>
        )}
      </div>
    );
  }

  // Versiune extinsă — pagina de detaliu
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {aromas.map(aroma => {
          const cat = getCategory(aroma);
          return (
            <span key={aroma} style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '0.3rem 0.75rem', borderRadius: '20px',
              background: cat.bg, border: `1px solid ${cat.border}`,
              fontSize: '0.75rem', color: cat.color,
              fontFamily: "'Jost', sans-serif", fontWeight: 300,
              letterSpacing: '0.03em',
            }}>
              {aroma}
            </span>
          );
        })}
      </div>
    </div>
  );
}
