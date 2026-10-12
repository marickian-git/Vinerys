import Link from 'next/link';
import { AROMA_CATEGORY_LABELS } from '@/utils/tasteProfile';

const TYPE_LABELS = { RED: 'roșu', WHITE: 'alb', ROSE: 'rosé', SPARKLING: 'spumant', DESSERT: 'desert', FORTIFIED: 'fortifiat' };
const reasonLabel = (r) => (r.kind === 'aroma' ? AROMA_CATEGORY_LABELS[r.key] : r.kind === 'type' ? TYPE_LABELS[r.key] : r.label);
const chip = { display: 'inline-block', padding: '0.3rem 0.7rem', borderRadius: 999, border: '1px solid rgba(196,69,105,0.35)', fontSize: '0.78rem', margin: '0 0.35rem 0.35rem 0' };

// AI-011: ce îți place, învățat din ratinguri, degustări și consum; plus ce ai deschide acum
export default function TasteProfile({ data }) {
  const { profile, picks } = data ?? {};
  if (!profile?.evidence) {
    return <p style={{ fontSize: '0.85rem', margin: 0, opacity: 0.75 }}>Dă note vinurilor sau notează degustări și îți învăț gusturile.</p>;
  }
  const groups = [
    ['Soiuri', profile.top.grape.map((e) => e.label)],
    ['Stil', [...profile.top.type.map((e) => TYPE_LABELS[e.key]), ...profile.top.aroma.map((e) => AROMA_CATEGORY_LABELS[e.key])]],
    ['Locuri', [...profile.top.region.map((e) => e.label), ...profile.top.country.map((e) => e.label)]],
  ].filter(([, items]) => items.length);
  return (
    <div>
      {!profile.confident && <p style={{ fontSize: '0.78rem', opacity: 0.65, marginTop: 0 }}>Bazat pe {profile.evidence} {profile.evidence === 1 ? 'vin' : 'vinuri'}; devine mai precis cu fiecare degustare.</p>}
      {groups.map(([label, items]) => (
        <div key={label} style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: 4 }}>{label}</div>
          {items.map((item) => <span key={item} style={chip}>{item}</span>)}
        </div>
      ))}
      {profile.avoid.length > 0 && (
        <p style={{ fontSize: '0.8rem', opacity: 0.75 }}>Îți plac mai puțin: {profile.avoid.map(reasonLabel).join(', ')}.</p>
      )}
      {picks.length > 0 && (
        <div style={{ marginTop: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6, marginBottom: 6 }}>Din pivniță, pe gustul tău</div>
          <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.88rem' }}>
            {picks.map(({ wine, score, reasons }) => (
              <li key={wine.id} style={{ marginBottom: 4 }}>
                <Link href={`/wines/${wine.id}`} style={{ color: '#f5e6e8' }}>{wine.name}{wine.vintage ? ` ${wine.vintage}` : ''}</Link>
                <span style={{ opacity: 0.65 }}> · {Math.round(score * 100)}% potrivire{reasons.length ? ` (${reasons.map(reasonLabel).join(', ')})` : ''}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
