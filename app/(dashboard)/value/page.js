import Link from 'next/link';
import { getValueReport } from '@/utils/actions';
import { formatMoney } from '@/utils/currency';
import { formatRoi } from '@/utils/valuation';

export const metadata = { title: 'Valoarea pivniței — Vinerys' };

const card = { border: '1px solid rgba(196,69,105,0.2)', borderRadius: 14, padding: '1rem 1.2rem' };

function WineRows({ title, rows, currency }) {
  if (!rows.length) return null;
  return (
    <section style={card}>
      <h2 style={{ margin: '0 0 0.6rem', fontSize: '1rem', fontWeight: 500 }}>{title}</h2>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.88rem' }}>
        {rows.map((r) => (
          <li key={r.id} style={{ display: 'flex', gap: 10, alignItems: 'baseline' }}>
            <Link href={`/wines/${r.id}`} style={{ color: '#f5e6e8', flexGrow: 1 }}>{r.name}{r.vintage ? ` ${r.vintage}` : ''}</Link>
            <span style={{ opacity: 0.7 }}>{formatMoney(r.purchasePrice, currency)} → {formatMoney(r.estimatedValue, currency)}</span>
            <strong style={{ color: r.roi >= 0 ? '#7fc79a' : '#ff8f8f', minWidth: 52, textAlign: 'right' }}>{formatRoi(r.roi)}</strong>
          </li>
        ))}
      </ul>
    </section>
  );
}

// CELLAR-008: cost, valoare estimată, câștig și ROI pentru vinurile din pivniță
export default async function ValuePage() {
  const report = await getValueReport();
  const { currency } = report;
  const stats = [
    ['Valoare estimată', formatMoney(report.totalValue, currency, { decimals: 0 })],
    ['Cost (vinuri cu preț)', formatMoney(report.cost, currency, { decimals: 0 })],
    ['Câștig', `${report.gain >= 0 ? '+' : ''}${formatMoney(report.gain, currency, { decimals: 0 })}`],
    ['ROI', formatRoi(report.roi)],
  ];
  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 4rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href="/wines" style={{ color: 'rgba(245,230,232,0.6)', fontSize: '0.75rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' }}>← Pivniță</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: '2.4rem', margin: 0 }}>Valoarea pivniței</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {stats.map(([label, value]) => (
            <div key={label} style={card}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.12em', opacity: 0.6 }}>{label}</div>
              <div style={{ fontSize: '1.5rem', marginTop: 4 }}>{value}</div>
            </div>
          ))}
        </div>
        {report.missing > 0 && <p style={{ fontSize: '0.82rem', opacity: 0.7, margin: 0 }}>{report.missing} {report.missing === 1 ? 'vin nu are' : 'vinuri nu au'} preț de achiziție sau valoare estimată și nu intră în ROI.</p>}
        <WineRows title="Cele mai mari câștiguri" rows={report.gainers} currency={currency} />
        <WineRows title="Pierderi" rows={report.losers} currency={currency} />
        <p style={{ margin: 0 }}>
          <Link href="/value/report" style={{ color: '#d97a95' }}>Raport pentru asigurare (printabil / PDF) →</Link>
        </p>
      </div>
    </main>
  );
}
