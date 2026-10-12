import Link from 'next/link';
import DishPairing from '@/components/DishPairing';

export const metadata = { title: 'Ce gătesc azi? — Vinerys' };

export default function PairingPage() {
  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 4rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/wines" style={{ color: 'rgba(245,230,232,0.6)', fontSize: '0.75rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' }}>← Pivniță</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: '2.4rem', margin: '1rem 0 0.25rem' }}>Ce gătesc azi?</h1>
        <p style={{ color: 'rgba(245,230,232,0.7)', fontSize: '0.92rem', marginTop: 0 }}>Spune ce mănânci și îți aleg sticla din pivniță: cea mai potrivită, cu prioritate pentru cele care trebuie băute curând.</p>
        <DishPairing />
      </div>
    </main>
  );
}
