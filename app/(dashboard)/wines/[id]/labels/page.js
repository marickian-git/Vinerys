import { notFound } from 'next/navigation';
import { getWineById } from '@/utils/actions';
import { MAX_LABELS, bottleUrl, qrSvg } from '@/utils/qr';
import PrintButton from '@/components/PrintButton';

export const metadata = { title: 'Etichete QR — Vinerys' };

// Foaie de etichete de printat: un QR pentru fiecare sticlă din pivniță (sau ?count=N)
export default async function LabelsPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  let wine;
  try {
    wine = await getWineById(id);
  } catch {
    notFound();
  }
  const count = Math.min(MAX_LABELS, Math.max(1, Number.parseInt(sp.count, 10) || wine.quantity || 1));
  const svg = await qrSvg(bottleUrl(wine.id));
  const caption = [wine.name, wine.vintage].filter(Boolean).join(' ');

  return (
    <main style={{ background: '#ffffff', color: '#111111', minHeight: '100vh', padding: '1.5rem', fontFamily: 'system-ui, sans-serif' }}>
      <style>{`
        @media print { .no-print { display: none !important; } main { padding: 0 !important; } @page { margin: 10mm; } }
        .qr svg { width: 100%; height: auto; display: block; }
      `}</style>
      <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.2rem', margin: 0, flexGrow: 1 }}>Etichete QR · {caption} · {count} {count === 1 ? 'etichetă' : 'etichete'}</h1>
        <form style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: '0.9rem' }}>
          <label htmlFor="count">Câte</label>
          <input id="count" name="count" type="number" min="1" max={MAX_LABELS} defaultValue={count} style={{ width: 70, padding: 4 }} />
          <button type="submit">Actualizează</button>
        </form>
        <PrintButton />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(38mm, 1fr))', gap: '4mm' }}>
        {Array.from({ length: count }, (_, i) => (
          <figure key={i} style={{ margin: 0, padding: '3mm', border: '1px dashed #999', breakInside: 'avoid', textAlign: 'center' }}>
            <div className="qr" role="img" aria-label={`Cod QR pentru ${caption}`} dangerouslySetInnerHTML={{ __html: svg }} />
            <figcaption style={{ fontSize: '8pt', marginTop: '1mm', lineHeight: 1.2 }}>{caption}</figcaption>
          </figure>
        ))}
      </div>
    </main>
  );
}
