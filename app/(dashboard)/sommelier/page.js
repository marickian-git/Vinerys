import Link from 'next/link';
import SommelierChat from '@/components/SommelierChat';
import WeekendPlan from '@/components/WeekendPlan';
import { getWeekendPlan } from '@/utils/actions';

export const metadata = { title: 'Sommelier — Vinerys' };

export default async function SommelierPage() {
  const plan = await getWeekendPlan();
  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 2rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <Link href="/wines" style={{ color: 'rgba(245,230,232,0.6)', fontSize: '0.75rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' }}>← Pivniță</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: '2.4rem', margin: '1rem 0 0.25rem' }}>Sommelier</h1>
        <p style={{ color: 'rgba(245,230,232,0.7)', fontSize: '0.92rem', marginTop: 0 }}>Întreabă orice despre vin. Când e vorba de pivnița ta, caută în vinurile tale reale și recomandă doar ce ai.</p>
        <section aria-labelledby="weekend-plan" style={{ margin: '1rem 0 2rem' }}>
          <h2 id="weekend-plan" style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 0.6rem' }}>Planul weekendului</h2>
          <WeekendPlan plan={plan} />
        </section>
        <SommelierChat />
      </div>
    </main>
  );
}
