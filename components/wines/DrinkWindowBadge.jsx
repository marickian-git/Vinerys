'use client';

const currentYear = new Date().getFullYear();

function getStatus(drinkFrom, drinkUntil) {
  if (!drinkFrom && !drinkUntil) return null;

  if (drinkFrom && currentYear < drinkFrom) {
    return {
      status: 'early',
      icon: '🟡',
      label: 'Prea devreme',
      sub: `Optim din ${drinkFrom}`,
      color: 'rgba(212,175,55,0.9)',
      bg: 'rgba(212,175,55,0.08)',
      border: 'rgba(212,175,55,0.2)',
    };
  }

  if (drinkUntil && currentYear > drinkUntil) {
    return {
      status: 'late',
      icon: '🔴',
      label: 'Trecut de vârf',
      sub: `Optim era până în ${drinkUntil}`,
      color: 'rgba(220,80,80,0.9)',
      bg: 'rgba(220,80,80,0.08)',
      border: 'rgba(220,80,80,0.2)',
    };
  }

  // În fereastră
  const until = drinkUntil || drinkFrom;
  const yearsLeft = until - currentYear;
  return {
    status: 'optimal',
    icon: '🟢',
    label: 'Fereastră optimă',
    sub: yearsLeft <= 0
      ? 'Ultimul an recomandat'
      : `Încă ${yearsLeft} ${yearsLeft === 1 ? 'an' : 'ani'}`,
    color: 'rgba(85,196,78,0.9)',
    bg: 'rgba(85,196,78,0.08)',
    border: 'rgba(85,196,78,0.2)',
  };
}

// Varianta compactă — pentru WineCard
export function DrinkWindowBadge({ drinkFrom, drinkUntil }) {
  const s = getStatus(drinkFrom, drinkUntil);
  if (!s) return null;

  // Dot color only — no icon, no background block
  const dotColor = s.status === 'optimal' ? '#55c44e' : s.status === 'early' ? '#d4af37' : '#dc5050';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      padding: '0.12rem 0.5rem', borderRadius: '20px',
      background: s.bg, border: `1px solid ${s.border}`,
      fontSize: '0.6rem', color: s.color, fontWeight: 400,
      letterSpacing: '0.02em', whiteSpace: 'nowrap',
      fontFamily: "'Jost', sans-serif",
      alignSelf: 'flex-start', flexShrink: 0,
      marginBottom: '0.5rem',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: dotColor, flexShrink: 0, display: 'inline-block' }} />
      {s.label}
      {drinkFrom && drinkUntil && (
        <span style={{ opacity: 0.45, marginLeft: '0.15rem' }}>
          {drinkFrom}–{drinkUntil}
        </span>
      )}
    </span>
  );
}

// Varianta extinsă — pentru pagina de detaliu vin
export function DrinkWindowCard({ drinkFrom, drinkUntil }) {
  const s = getStatus(drinkFrom, drinkUntil);
  if (!s) return null;

  // Calculează progress bar
  const start = drinkFrom || (drinkUntil - 5);
  const end   = drinkUntil || (drinkFrom + 5);
  const total = end - start;
  const elapsed = Math.min(Math.max(currentYear - start, 0), total);
  const pct = total > 0 ? Math.round((elapsed / total) * 100) : 0;

  return (
    <div style={{
      padding: '1rem 1.25rem',
      background: s.bg,
      border: `1px solid ${s.border}`,
      borderRadius: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1rem' }}>{s.icon}</span>
          <div>
            <div style={{ fontSize: '0.8rem', color: s.color, fontWeight: 500, letterSpacing: '0.05em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(245,230,232,0.4)', marginTop: '0.1rem' }}>
              {s.sub}
            </div>
          </div>
        </div>
        {drinkFrom && drinkUntil && (
          <div style={{ fontSize: '0.75rem', color: 'rgba(245,230,232,0.5)', textAlign: 'right' }}>
            <span style={{ color: s.color }}>{drinkFrom}</span>
            <span style={{ color: 'rgba(245,230,232,0.2)', margin: '0 0.3rem' }}>—</span>
            <span style={{ color: s.color }}>{drinkUntil}</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {drinkFrom && drinkUntil && (
        <div>
          <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: s.status === 'optimal'
                ? 'linear-gradient(90deg, #55c44e, #8be886)'
                : s.status === 'early'
                ? 'linear-gradient(90deg, #d4af37, #f0d060)'
                : 'linear-gradient(90deg, #dc5050, #f07070)',
              borderRadius: '2px', transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.35rem' }}>
            <span style={{ fontSize: '0.62rem', color: 'rgba(245,230,232,0.25)' }}>{start}</span>
            <span style={{ fontSize: '0.62rem', color: 'rgba(245,230,232,0.4)' }}>
              {currentYear} ({pct}%)
            </span>
            <span style={{ fontSize: '0.62rem', color: 'rgba(245,230,232,0.25)' }}>{end}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DrinkWindowBadge;
