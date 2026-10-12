import Link from 'next/link';
import ImportWizard from '@/components/wines/ImportWizard';

export const metadata = { title: 'Import CSV — Vinerys' };

export default function ImportPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 4rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Link href="/wines/add" style={{ color: 'rgba(245,230,232,0.6)', fontSize: '0.75rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' }}>← Înapoi</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: '2.4rem', margin: '1rem 0 0.25rem' }}>Import din CSV</h1>
        <p style={{ color: 'rgba(245,230,232,0.65)', fontSize: '0.9rem', marginTop: 0 }}>
          Exportul din Vivino, CellarTracker sau orice tabel. Vezi rezultatul înainte să importi; duplicatele sunt sărite.
        </p>
        <ImportWizard />
      </div>
    </main>
  );
}
