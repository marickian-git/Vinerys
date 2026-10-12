'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { getImportDuplicateKeys, importWines } from '@/utils/actions';
import { SOURCES, TARGET_FIELDS, autoMapColumns, buildPreview, detectSource, parseCsv } from '@/utils/csvImport';

const FIELD_LABELS = {
  name: 'Nume', producer: 'Producător', vintage: 'An', country: 'Țară', region: 'Regiune', subregion: 'Subregiune',
  type: 'Tip', color: 'Culoare', grapeVarieties: 'Soiuri', quantity: 'Cantitate', bottleSize: 'Mărime sticlă',
  purchasePrice: 'Preț achiziție', estimatedValue: 'Valoare estimată', purchaseDate: 'Data achiziției',
  cellarLocation: 'Locație', rating: 'Rating', tastingNotes: 'Note', drinkFrom: 'Bea din', drinkUntil: 'Bea până', foodPairing: 'Asocieri gastronomice',
};
const STATUS = { ok: ['Nou', '#7fc79a'], duplicate: ['Duplicat', '#e0b860'], error: ['Eroare', '#ff8f8f'] };

const box = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(196,69,105,0.18)', borderRadius: 12, padding: '1.25rem', marginTop: '1.25rem' };
const control = { background: '#1a0f12', color: '#f5e6e8', border: '1px solid rgba(196,69,105,0.3)', borderRadius: 8, padding: '0.45rem 0.6rem', fontSize: '0.85rem' };
const button = { ...control, background: '#8b1a2e', borderColor: '#8b1a2e', padding: '0.7rem 1.4rem', cursor: 'pointer', fontSize: '0.9rem' };

export default function ImportWizard() {
  const router = useRouter();
  const [csv, setCsv] = useState(null);
  const [source, setSource] = useState('generic');
  const [mapping, setMapping] = useState({});
  const [existingKeys, setExistingKeys] = useState([]);
  const [importing, setImporting] = useState(false);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('Fișierul e prea mare (maximum 5 MB)');
    const parsed = parseCsv(await file.text());
    if (!parsed.headers.length || !parsed.rows.length) return toast.error('Fișierul nu conține rânduri');
    const detected = detectSource(parsed.headers);
    setCsv({ ...parsed, fileName: file.name });
    setSource(detected);
    setMapping(autoMapColumns(parsed.headers, detected));
    getImportDuplicateKeys().then(setExistingKeys).catch(() => setExistingKeys([]));
  };

  const changeSource = (id) => {
    setSource(id);
    setMapping(autoMapColumns(csv.headers, id));
  };

  const preview = useMemo(() => (csv ? buildPreview(csv.rows, mapping, existingKeys) : []), [csv, mapping, existingKeys]);
  const counts = preview.reduce((acc, row) => ({ ...acc, [row.status]: (acc[row.status] ?? 0) + 1 }), {});

  const runImport = async () => {
    const wines = preview.filter((row) => row.status === 'ok').map((row) => row.wine);
    if (!wines.length) return toast.error('Niciun vin nou de importat');
    setImporting(true);
    try {
      const result = await importWines(wines, { source });
      if (result?.error) throw new Error(result.error);
      toast.success(`${result.imported} vinuri importate${result.skipped.length ? `, ${result.skipped.length} sărite` : ''}`);
      router.push('/wines');
    } catch (error) {
      toast.error(error.message || 'Importul a eșuat');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div style={box}>
        <label htmlFor="csv-file" style={{ display: 'block', fontSize: '0.8rem', marginBottom: '0.5rem' }}>Fișier CSV</label>
        <input id="csv-file" type="file" accept=".csv,text/csv" onChange={handleFile} style={control} />
        {csv && (
          <p style={{ fontSize: '0.8rem', opacity: 0.75, marginBottom: 0 }}>
            {csv.fileName}: {csv.rows.length} rânduri, {csv.headers.length} coloane.{' '}
            <label htmlFor="csv-source">Format:</label>{' '}
            <select id="csv-source" value={source} onChange={(e) => changeSource(e.target.value)} style={control}>
              {Object.entries(SOURCES).map(([id, item]) => <option key={id} value={id}>{item.label}</option>)}
            </select>
          </p>
        )}
      </div>

      {csv && (
        <div style={box}>
          <h2 style={{ fontSize: '1rem', fontWeight: 500, margin: '0 0 0.75rem' }}>Coloane</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.6rem' }}>
            {TARGET_FIELDS.map((field) => (
              <label key={field} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem' }}>
                {FIELD_LABELS[field]}
                <select
                  value={mapping[field] ?? ''}
                  onChange={(e) => setMapping((current) => ({ ...current, [field]: e.target.value || undefined }))}
                  style={control}
                >
                  <option value="">—</option>
                  {csv.headers.map((header) => <option key={header} value={header}>{header}</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>
      )}

      {csv && (
        <div style={box}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              {counts.ok ?? 0} noi · {counts.duplicate ?? 0} duplicate · {counts.error ?? 0} cu erori
            </p>
            <button type="button" onClick={runImport} disabled={importing || !counts.ok} style={{ ...button, opacity: importing || !counts.ok ? 0.5 : 1 }}>
              {importing ? 'Se importă…' : `Importă ${counts.ok ?? 0} vinuri`}
            </button>
          </div>
          <div style={{ overflowX: 'auto', marginTop: '1rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr>{['', 'Nume', 'Producător', 'An', 'Tip', 'Sticle', 'Țară'].map((h) => <th key={h} scope="col" style={{ textAlign: 'left', padding: '0.4rem', opacity: 0.7, fontWeight: 500 }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.slice(0, 200).map((row) => (
                  <tr key={row.index} style={{ borderTop: '1px solid rgba(196,69,105,0.12)' }}>
                    <td style={{ padding: '0.4rem', color: STATUS[row.status][1], whiteSpace: 'nowrap' }}>{STATUS[row.status][0]}</td>
                    {row.wine ? (
                      <>
                        <td style={{ padding: '0.4rem' }}>{row.wine.name}</td>
                        <td style={{ padding: '0.4rem' }}>{row.wine.producer ?? '—'}</td>
                        <td style={{ padding: '0.4rem' }}>{row.wine.vintage ?? '—'}</td>
                        <td style={{ padding: '0.4rem' }}>{row.wine.type}</td>
                        <td style={{ padding: '0.4rem' }}>{row.wine.quantity}</td>
                        <td style={{ padding: '0.4rem' }}>{row.wine.country ?? '—'}</td>
                      </>
                    ) : (
                      <td colSpan={6} style={{ padding: '0.4rem', opacity: 0.8 }}>Rândul {row.index + 2}: {row.error}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 200 && <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Se afișează primele 200 de rânduri din {preview.length}.</p>}
          </div>
        </div>
      )}
    </div>
  );
}
