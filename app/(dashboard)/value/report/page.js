import { getValueReport } from '@/utils/actions';
import { formatMoney } from '@/utils/currency';
import PrintButton from '@/components/PrintButton';

export const metadata = { title: 'Raport de valoare — Vinerys' };

// CELLAR-008: raport printabil (Salvează ca PDF din browser) pentru asigurare
export default async function ValueReportPage() {
  const report = await getValueReport();
  const { currency } = report;
  const cell = { padding: '4px 6px', borderBottom: '1px solid #ddd', textAlign: 'left', fontSize: '9.5pt' };
  return (
    <div style={{ background: '#fff', color: '#111', minHeight: '100vh', padding: '1.5rem', fontFamily: 'Georgia, serif' }}>
      <style>{'@media print { .no-print { display: none !important; } main { padding: 0 !important; } @page { margin: 14mm; } }'}</style>
      <div className="no-print" style={{ marginBottom: '1rem', fontFamily: 'system-ui, sans-serif' }}><PrintButton label="Printează / Salvează PDF" /></div>
      <h1 style={{ margin: 0, fontSize: '18pt' }}>Raport de valoare · {report.owner}</h1>
      <p style={{ margin: '4px 0 16px', fontSize: '10pt', color: '#444' }}>
        Generat {new Date(report.generatedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })} · {report.bottles} sticle ·
        valoare estimată totală <strong>{formatMoney(report.totalValue, currency, { decimals: 0 })}</strong>
      </p>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>{['Vin', 'An', 'Producător', 'Sticle', 'Mărime', 'Locație', 'Preț achiziție', 'Valoare / sticlă', 'Valoare totală'].map((h) => <th key={h} scope="col" style={{ ...cell, borderBottom: '2px solid #111' }}>{h}</th>)}</tr>
        </thead>
        <tbody>
          {report.rows.map((r) => (
            <tr key={r.id}>
              <td style={cell}>{r.name}</td>
              <td style={cell}>{r.vintage ?? '—'}</td>
              <td style={cell}>{r.producer ?? '—'}</td>
              <td style={cell}>{r.quantity}</td>
              <td style={cell}>{r.bottleSize ?? '—'}</td>
              <td style={cell}>{r.cellarLocation ?? '—'}</td>
              <td style={cell}>{formatMoney(r.purchasePrice, currency)}</td>
              <td style={cell}>{formatMoney(r.estimatedValue, currency)}</td>
              <td style={cell}>{formatMoney(r.value, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ marginTop: 16, fontSize: '8.5pt', color: '#555' }}>
        Valorile sunt estimări (introduse manual sau sugerate de AI la scanare) și nu reprezintă o evaluare autorizată.
        {report.rows.some((r) => r.originalCurrency !== currency) && ` Sumele în alte monede sunt convertite în ${currency} cu cursul BCE din ziua generării.`}
      </p>
    </div>
  );
}
