import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getWineById } from '@/utils/actions';
import QuickConsume from '@/components/wines/QuickConsume';

export const metadata = { title: 'Sticlă — Vinerys' };

// Pagina deschisă de QR-ul de pe sticlă: un tap = o sticlă consumată
export default async function BottlePage({ params }) {
  const { id } = await params;
  let wine;
  try {
    wine = await getWineById(id);
  } catch {
    notFound();
  }
  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 3rem', fontFamily: 'Jost, system-ui, sans-serif', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 420, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#d97a95' }}>Sticla scanată</p>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: '2.2rem', margin: 0 }}>{wine.name}</h1>
        <p style={{ margin: 0, color: 'rgba(245,230,232,0.7)' }}>{[wine.producer, wine.vintage, wine.cellarLocation && `📍 ${wine.cellarLocation}`].filter(Boolean).join(' · ')}</p>
        <QuickConsume wineId={wine.id} quantity={wine.quantity} />
        <Link href={`/wines/${wine.id}`} style={{ color: '#d97a95', fontSize: '0.9rem' }}>Detaliile vinului →</Link>
      </div>
    </main>
  );
}
