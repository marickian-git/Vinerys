// SOCIAL-005: badge-urile cu nivel și progres spre următorul prag
const TIER_COLORS = ['rgba(245,230,232,0.25)', '#c8875a', '#c9ced6', '#e8b04a', '#a9d8e8'];

export default function BadgeGrid({ badges = [], challenge = null }) {
  return (
    <div>
      {challenge && (
        <p style={{ margin: '0 0 1rem', fontSize: '0.88rem' }}>
          Următoarea provocare: <strong>{challenge.icon} {challenge.name}</strong>, mai ai {challenge.next - challenge.value} până la nivelul {challenge.level + 1}.
        </p>
      )}
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.75rem' }}>
        {badges.map((badge) => (
          <li key={badge.id} style={{ padding: '0.9rem', borderRadius: 12, border: `1px ${badge.level ? 'solid' : 'dashed'} ${TIER_COLORS[badge.level]}`, background: 'rgba(255,255,255,0.02)' }}>
            <div aria-hidden="true" style={{ fontSize: '1.6rem' }}>{badge.icon}</div>
            <div style={{ fontWeight: 500, fontSize: '0.88rem', marginTop: 4 }}>{badge.name}</div>
            <div style={{ fontSize: '0.72rem', color: TIER_COLORS[badge.level] === TIER_COLORS[0] ? 'rgba(245,230,232,0.6)' : TIER_COLORS[badge.level] }}>
              {badge.tierName ?? 'Neînceput'} · {badge.value}{badge.next ? ` / ${badge.next}` : ''}
            </div>
            <div role="progressbar" aria-label={`${badge.name}: ${badge.value} din ${badge.next ?? badge.value}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(badge.progress * 100)}
              style={{ height: 4, borderRadius: 2, background: 'rgba(245,230,232,0.12)', marginTop: 8 }}>
              <div style={{ width: `${badge.progress * 100}%`, height: 4, borderRadius: 2, background: '#c44569' }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'rgba(245,230,232,0.6)', marginTop: 6 }}>{badge.description}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
