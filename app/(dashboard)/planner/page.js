import Link from 'next/link';
import { getConsumptionPlan } from '@/utils/actions';

export const metadata = { title: 'Plan de consum — Vinerys' };

const STATUS = {
  overdue: { label: 'Trecut de vârf', color: '#ff8f8f' },
  ending: { label: 'Ultimul an', color: '#e8b04a' },
  peak: { label: 'În fereastră', color: '#7fc79a' },
};
const TYPE_DOT = { RED: '#8b1a2e', WHITE: '#e6d79a', ROSE: '#e8a0a0', SPARKLING: '#f3e7b0', DESSERT: '#d9a441', FORTIFIED: '#6b2a1a' };

// CELLAR-006: câte sticle să deschizi în fiecare an, ca niciuna să nu treacă de vârf
export default async function PlannerPage() {
  const plan = await getConsumptionPlan();
  const max = Math.max(1, ...plan.years.map((y) => y.bottles));
  const total = plan.years.reduce((sum, y) => sum + y.bottles, 0) + (plan.later?.bottles ?? 0);
  const thisYear = plan.years[0];

  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 4rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <Link href="/wines" style={{ color: 'rgba(245,230,232,0.6)', fontSize: '0.75rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' }}>← Pivniță</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: '2.4rem', margin: '1rem 0 0.25rem' }}>Plan de consum</h1>
        <p style={{ color: 'rgba(245,230,232,0.7)', fontSize: '0.92rem', marginTop: 0 }}>
          {thisYear.bottles > 0
            ? <>În {thisYear.year} ar trebui să deschizi <strong>{thisYear.bottles}</strong> {thisYear.bottles === 1 ? 'sticlă' : 'sticle'}{plan.overdue > 0 && <>, dintre care <strong style={{ color: STATUS.overdue.color }}>{plan.overdue} trecute de vârf</strong></>}. </>
            : <>Nimic urgent în {thisYear.year}. </>}
          Planul împarte cele {total} sticle cu fereastră cunoscută pe anii în care sunt bune de băut.
        </p>

        <div role="img" aria-label="Sticle de deschis pe an" style={{ display: 'grid', gridTemplateColumns: `repeat(${plan.years.length}, minmax(0, 1fr))`, gap: 6, alignItems: 'end', height: 110, margin: '1.5rem 0 0.4rem' }}>
          {plan.years.map((y) => (
            <div key={y.year} style={{ height: `${Math.max(3, (y.bottles / max) * 100)}%`, background: y.wines.some((w) => w.status === 'overdue') ? STATUS.overdue.color : '#c44569', borderRadius: 4, opacity: y.bottles ? 1 : 0.25 }} />
          ))}
        </div>
        <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: `repeat(${plan.years.length}, minmax(0, 1fr))`, gap: 6, fontSize: '0.7rem', color: 'rgba(245,230,232,0.6)', textAlign: 'center' }}>
          {plan.years.map((y) => <span key={y.year}>{String(y.year).slice(2)}</span>)}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          {plan.years.filter((y) => y.bottles > 0).map((y) => (
            <section key={y.year} style={{ border: '1px solid rgba(196,69,105,0.18)', borderRadius: 12, padding: '1rem 1.25rem' }}>
              <h2 style={{ margin: '0 0 0.6rem', fontSize: '1.1rem', fontWeight: 500 }}>{y.year} · {y.bottles} {y.bottles === 1 ? 'sticlă' : 'sticle'}</h2>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {y.wines.map((w) => (
                  <li key={w.wineId} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.88rem' }}>
                    <span aria-hidden="true" style={{ width: 10, height: 10, borderRadius: 5, background: TYPE_DOT[w.type] ?? '#888', flexShrink: 0 }} />
                    <Link href={`/wines/${w.wineId}`} style={{ color: '#f5e6e8', flexGrow: 1 }}>{w.name}{w.vintage ? ` ${w.vintage}` : ''}</Link>
                    <span style={{ color: STATUS[w.status].color, fontSize: '0.75rem' }}>{STATUS[w.status].label}</span>
                    <span style={{ minWidth: 28, textAlign: 'right' }}>×{w.bottles}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {plan.later && <p style={{ fontSize: '0.85rem', color: 'rgba(245,230,232,0.65)' }}>După {plan.later.from - 1}: încă {plan.later.bottles} {plan.later.bottles === 1 ? 'sticlă' : 'sticle'} cu fereastră lungă.</p>}
          {plan.unknown.length > 0 && (
            <section style={{ border: '1px dashed rgba(245,230,232,0.25)', borderRadius: 12, padding: '1rem 1.25rem' }}>
              <h2 style={{ margin: '0 0 0.4rem', fontSize: '1rem', fontWeight: 500 }}>Fără fereastră de consum</h2>
              <p style={{ margin: '0 0 0.6rem', fontSize: '0.8rem', color: 'rgba(245,230,232,0.65)' }}>Completează „Bea din / până” în fișa vinului ca să intre în plan.</p>
              <ul style={{ margin: 0, paddingLeft: '1.1rem', fontSize: '0.88rem' }}>
                {plan.unknown.map((w) => <li key={w.wineId}><Link href={`/wines/edit/${w.wineId}`} style={{ color: '#f5e6e8' }}>{w.name}</Link> ×{w.bottles}</li>)}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
