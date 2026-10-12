import Link from 'next/link';
import { getTastings } from '@/utils/actions';
import TastingJournal from '@/components/wines/TastingJournal';

export const metadata = { title: 'Jurnal de degustare — Vinerys' };

// CELLAR-003: toate degustările, cea mai nouă prima
export default async function TastingsPage() {
  const tastings = await getTastings({ limit: 300 });
  const rated = tastings.filter((t) => t.rating);
  const average = rated.length ? (rated.reduce((sum, t) => sum + t.rating, 0) / rated.length).toFixed(1) : null;
  return (
    <div style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 4rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <Link href="/wines" style={{ color: 'rgba(245,230,232,0.6)', fontSize: '0.75rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' }}>← Pivniță</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: '2.4rem', margin: '1rem 0 0.25rem' }}>Jurnal de degustare</h1>
        <p style={{ color: 'rgba(245,230,232,0.65)', fontSize: '0.9rem', marginTop: 0 }}>
          {tastings.length} {tastings.length === 1 ? 'degustare' : 'degustări'}{average && ` · rating mediu ${average}`}. Adaugi una nouă din pagina vinului.
        </p>
        <TastingJournal tastings={tastings} showWine />
      </div>
    </div>
  );
}
