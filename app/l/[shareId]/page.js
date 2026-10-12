import { notFound } from 'next/navigation';
import { publicList } from '@/server/lists';
import ReserveGiftButton from '@/components/lists/ReserveGiftButton';

export const metadata = { title: 'Listă de vinuri — Vinerys', robots: { index: false } };

// Pagina publică a unei liste (fără cont). Pe listele de cadouri, vizitatorii pot rezerva un vin.
export default async function PublicListPage({ params }) {
  const { shareId } = await params;
  const list = await publicList(shareId);
  if (!list) notFound();
  const gifts = list.kind === 'GIFTS';
  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '4rem 1.25rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d97a95' }}>{list.owner}</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: '2.4rem', margin: '0.4rem 0' }}>{list.name}</h1>
        {list.description && <p style={{ opacity: 0.8 }}>{list.description}</p>}
        {gifts && <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>Rezervă vinul pe care vrei să-l dăruiești, ca să nu-l cumpere și altcineva. Numele tău nu e afișat nimănui.</p>}
        <ul style={{ listStyle: 'none', margin: '1.5rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {list.items.map((item) => (
            <li key={item.id} style={{ border: '1px solid rgba(196,69,105,0.22)', borderRadius: 14, padding: '0.9rem 1.1rem', display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', opacity: item.purchased ? 0.55 : 1 }}>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: '1.05rem' }}>{item.name}{item.vintage ? ` ${item.vintage}` : ''}</div>
                {(item.producer || item.note) && <div style={{ fontSize: '0.82rem', opacity: 0.7 }}>{[item.producer, item.note].filter(Boolean).join(' · ')}</div>}
              </div>
              {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" style={{ color: '#d97a95', fontSize: '0.82rem' }}>Unde îl găsești ↗</a>}
              {gifts && !item.purchased && <ReserveGiftButton shareId={shareId} itemId={item.id} reserved={item.reserved} />}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
