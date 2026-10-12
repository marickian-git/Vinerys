import Link from 'next/link';

// HOME-006: „Planul weekendului”: zi, vin, mâncare, temperatură
export default function WeekendPlan({ plan = [] }) {
  if (!plan.length) return <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: 0 }}>Adaugă vinuri în pivniță ca să-ți fac planul de weekend.</p>;
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
      {plan.map((item) => (
        <li key={item.date} style={{ border: '1px solid rgba(196,69,105,0.22)', borderRadius: 14, padding: '0.9rem 1rem' }}>
          <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#d97a95' }}>
            {item.day} · {new Date(`${item.date}T12:00:00`).toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}
          </div>
          <Link href={`/wines/${item.wine.id}`} style={{ color: '#f5e6e8', fontSize: '1rem', display: 'block', margin: '0.3rem 0' }}>
            {item.wine.name}{item.wine.vintage ? ` ${item.wine.vintage}` : ''}
          </Link>
          <div style={{ fontSize: '0.8rem', opacity: 0.75 }}>
            {[item.food && `🍽 ${item.food}`, item.servingTemperature && `🌡 ${item.servingTemperature}`, item.wine.cellarLocation && `📍 ${item.wine.cellarLocation}`].filter(Boolean).join(' · ')}
          </div>
          {item.urgent && <div style={{ fontSize: '0.72rem', color: '#e8b04a', marginTop: 4 }}>De băut acum</div>}
        </li>
      ))}
    </ol>
  );
}
