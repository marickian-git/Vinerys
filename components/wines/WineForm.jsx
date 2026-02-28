'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createWine, updateWine } from '@/utils/actions';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/wines/ImageUpload';

const WINE_TYPES = [
  { value: 'RED',       label: '🔴 Roșu' },
  { value: 'WHITE',     label: '🟡 Alb' },
  { value: 'ROSE',      label: '🌸 Roze' },
  { value: 'SPARKLING', label: '✨ Spumant' },
  { value: 'DESSERT',   label: '🍯 Desert' },
  { value: 'FORTIFIED', label: '🏺 Fortifiat' },
];

const STATUSES = [
  { value: 'IN_CELLAR', label: 'În pivniță' },
  { value: 'CONSUMED',  label: 'Consumat' },
  { value: 'SOLD',      label: 'Vândut' },
  { value: 'GIFTED',    label: 'Dăruit' },
];

const BOTTLE_SIZES = ['0.187L', '0.375L', '0.5L', '0.75L', '1L', '1.5L', '3L', '6L'];

const SECTIONS = ['Informații de bază', 'Imagini', 'Detalii', 'Stocare & Preț', 'Degustare'];

const defaultForm = {
  name: '', producer: '', country: '', region: '', subregion: '',
  type: 'RED', vintage: '', alcoholPercentage: '', quantity: '1',
  cellarLocation: '', purchaseDate: '', purchasePrice: '', estimatedValue: '',
  rating: '', tastingNotes: '', servingTemperature: '', agingPotential: '',
  bottleSize: '0.75L', status: 'IN_CELLAR', isFavorite: false,
  grapeVarieties: '', foodPairing: '',
  labelImageUrl: '', bottleImageUrl: '',
};

export default function WineForm({ wine = null }) {
  const router = useRouter();
  const isEdit = !!wine;

  const [form, setForm] = useState(wine ? {
    name:               wine.name               || '',
    producer:           wine.producer           || '',
    country:            wine.country            || '',
    region:             wine.region             || '',
    subregion:          wine.subregion          || '',
    type:               wine.type               || 'RED',
    status:             wine.status             || 'IN_CELLAR',
    bottleSize:         wine.bottleSize         || '0.75L',
    cellarLocation:     wine.cellarLocation     || '',
    servingTemperature: wine.servingTemperature || '',
    agingPotential:     wine.agingPotential     || '',
    tastingNotes:       wine.tastingNotes       || '',
    labelImageUrl:      wine.labelImageUrl      || '',
    bottleImageUrl:     wine.bottleImageUrl     || '',
    isFavorite:         wine.isFavorite         ?? false,
    vintage:            wine.vintage?.toString()          || '',
    alcoholPercentage:  wine.alcoholPercentage?.toString()|| '',
    quantity:           wine.quantity?.toString()         || '1',
    purchasePrice:      wine.purchasePrice?.toString()    || '',
    estimatedValue:     wine.estimatedValue?.toString()   || '',
    rating:             wine.rating?.toString()           || '',
    purchaseDate:       wine.purchaseDate ? new Date(wine.purchaseDate).toISOString().split('T')[0] : '',
    grapeVarieties:     wine.grapeVarieties?.join(', ')   || '',
    foodPairing:        wine.foodPairing?.join(', ')      || '',
  } : defaultForm);

  const [section, setSection] = useState(0);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'grapeVarieties' || k === 'foodPairing') {
        const arr = v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
        fd.append(k, JSON.stringify(arr));
      } else if (typeof v === 'boolean') {
        fd.append(k, v.toString());
      } else if (v !== '' && v !== null && v !== undefined) {
        fd.append(k, v);
      }
    });

    try {
      const result = isEdit
        ? await updateWine(wine.id, fd)
        : await createWine(fd);

      if (result?.error) {
        setErrors(result.error);
        toast.error('Verifică câmpurile cu erori');
        setLoading(false);
        return;
      }
      toast.success(isEdit ? 'Vin actualizat!' : 'Vin adăugat în colecție!');
    } catch (err) {
      if (!err.message?.includes('NEXT_REDIRECT')) {
        toast.error('A apărut o eroare');
        setLoading(false);
      }
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .wform-wrap { font-family: 'Jost', sans-serif; }

        .wform-tabs {
          display: flex;
          gap: 0;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(196,69,105,0.15);
          overflow-x: auto;
          scrollbar-width: none;
        }
        .wform-tabs::-webkit-scrollbar { display: none; }
        .wform-tab {
          padding: 0.65rem 1.1rem;
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245,230,232,0.35);
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          font-family: 'Jost', sans-serif;
          margin-bottom: -1px;
        }
        .wform-tab:hover { color: rgba(245,230,232,0.65); }
        .wform-tab.active { color: #c44569; border-bottom-color: #c44569; }

        .wform-section { display: none; }
        .wform-section.active { display: block; }

        .wform-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.1rem;
        }
        .wform-full { grid-column: 1 / -1; }

        .wform-label {
          display: block;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(245,230,232,0.45);
          margin-bottom: 0.5rem;
          font-weight: 400;
        }
        .wform-label.required::after { content: ' *'; color: #c44569; }

        .wform-input, .wform-select, .wform-textarea {
          width: 100%;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15);
          border-radius: 8px;
          color: #f5e6e8;
          font-family: 'Jost', sans-serif;
          font-size: 0.85rem;
          font-weight: 300;
          outline: none;
          transition: all 0.25s ease;
        }
        .wform-input::placeholder, .wform-textarea::placeholder { color: rgba(245,230,232,0.2); }
        .wform-input:focus, .wform-select:focus, .wform-textarea:focus {
          border-color: rgba(196,69,105,0.5);
          background: rgba(196,69,105,0.04);
          box-shadow: 0 0 0 3px rgba(196,69,105,0.07);
        }
        .wform-input.error { border-color: rgba(220,80,80,0.5); }
        .wform-input:-webkit-autofill { -webkit-box-shadow: 0 0 0 100px #1a0810 inset; -webkit-text-fill-color: #f5e6e8; }

        .wform-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(196,69,105,0.6)' strokeWidth='1.5' fill='none' strokeLinecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2.2rem;
          cursor: pointer;
        }
        .wform-select option { background: #1a0810; }
        .wform-textarea { resize: vertical; min-height: 90px; line-height: 1.6; }

        .wform-error-msg {
          font-size: 0.68rem;
          color: rgba(220,80,80,0.8);
          margin-top: 0.35rem;
          letter-spacing: 0.03em;
        }

        .wform-img-hint {
          font-size: 0.78rem;
          color: rgba(245,230,232,0.35);
          font-weight: 300;
          margin-bottom: 1.5rem;
          padding: 0.85rem 1rem;
          background: rgba(196,69,105,0.05);
          border: 1px solid rgba(196,69,105,0.1);
          border-radius: 8px;
          line-height: 1.7;
        }

        .wform-stars {
          display: flex;
          gap: 0.35rem;
          padding: 0.6rem 0;
        }
        .wform-star {
          font-size: 1.4rem;
          cursor: pointer;
          transition: transform 0.15s ease;
          line-height: 1;
          color: rgba(245,230,232,0.15);
        }
        .wform-star:hover, .wform-star.filled { color: #d4af37; }
        .wform-star:hover { transform: scale(1.2); }

        .wform-check-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15);
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .wform-check-wrap:hover { border-color: rgba(196,69,105,0.35); background: rgba(196,69,105,0.04); }
        .wform-check-wrap input { display: none; }
        .wform-check-box {
          width: 18px; height: 18px;
          border: 1px solid rgba(196,69,105,0.4);
          border-radius: 4px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.2s;
          font-size: 0.7rem;
        }
        .wform-check-box.checked { background: linear-gradient(135deg, #8b1a2e, #c44569); border-color: transparent; }
        .wform-check-label { font-size: 0.82rem; color: rgba(245,230,232,0.6); font-weight: 300; }

        .wform-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid rgba(196,69,105,0.1);
          gap: 1rem;
        }
        .wform-btn-back {
          padding: 0.7rem 1.25rem;
          background: transparent;
          border: 1px solid rgba(196,69,105,0.2);
          border-radius: 8px;
          color: rgba(245,230,232,0.5);
          font-family: 'Jost', sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
        }
        .wform-btn-back:hover { border-color: rgba(196,69,105,0.4); color: rgba(245,230,232,0.8); }

        .wform-btn-next {
          padding: 0.7rem 1.5rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none;
          border-radius: 8px;
          color: #f5e6e8;
          font-family: 'Jost', sans-serif;
          font-size: 0.78rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s;
          position: relative;
          overflow: hidden;
        }
        .wform-btn-next::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, #c44569, #8b1a2e); opacity: 0; transition: opacity 0.25s; }
        .wform-btn-next:hover::before { opacity: 1; }
        .wform-btn-next:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(196,69,105,0.35); }
        .wform-btn-next:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .wform-btn-next span { position: relative; z-index: 1; }

        .wform-progress { display: flex; gap: 4px; align-items: center; }
        .wform-prog-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: rgba(196,69,105,0.2);
          transition: all 0.2s;
        }
        .wform-prog-dot.active { background: #c44569; transform: scale(1.3); }
        .wform-prog-dot.done { background: rgba(196,69,105,0.5); }

        .wform-spinner { width: 14px; height: 14px; border: 2px solid rgba(245,230,232,0.3); border-top-color: #f5e6e8; border-radius: 50%; animation: wfspin 0.6s linear infinite; display: inline-block; margin-right: 6px; vertical-align: middle; }
        @keyframes wfspin { to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .wform-grid { grid-template-columns: 1fr; }
          .wform-full { grid-column: 1; }
        }
      `}</style>

      <form className="wform-wrap" onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="wform-tabs">
          {SECTIONS.map((s, i) => (
            <button
              key={s}
              type="button"
              className={`wform-tab ${section === i ? 'active' : ''}`}
              onClick={() => setSection(i)}
            >
              {s}
            </button>
          ))}
        </div>

        {/* ── SECTION 0: Informații de bază ── */}
        <div className={`wform-section ${section === 0 ? 'active' : ''}`}>
          <div className="wform-grid">
            <div className="wform-field wform-full">
              <label className="wform-label required">Nume vin</label>
              <input
                className={`wform-input ${errors.name ? 'error' : ''}`}
                placeholder="ex. Château Margaux"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                required
              />
              {errors.name && <p className="wform-error-msg">{errors.name[0]}</p>}
            </div>

            <div className="wform-field">
              <label className="wform-label">Producător</label>
              <input className="wform-input" placeholder="ex. Domaine Leflaive" value={form.producer} onChange={e => set('producer', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label required">Tip vin</label>
              <select className="wform-select" value={form.type} onChange={e => set('type', e.target.value)} required>
                {WINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            <div className="wform-field">
              <label className="wform-label">Țară</label>
              <input className="wform-input" placeholder="ex. Franța, România" value={form.country} onChange={e => set('country', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label">Regiune</label>
              <input className="wform-input" placeholder="ex. Bordeaux, Dealu Mare" value={form.region} onChange={e => set('region', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label">Subregiune</label>
              <input className="wform-input" placeholder="ex. Pauillac" value={form.subregion} onChange={e => set('subregion', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label">An recoltă</label>
              <input
                className="wform-input"
                type="number"
                placeholder="ex. 2018"
                min="1800"
                max={new Date().getFullYear()}
                value={form.vintage}
                onChange={e => set('vintage', e.target.value)}
              />
            </div>

            <div className="wform-field">
              <label className="wform-label">Status</label>
              <select className="wform-select" value={form.status} onChange={e => set('status', e.target.value)}>
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── SECTION 1: Imagini ── */}
        <div className={`wform-section ${section === 1 ? 'active' : ''}`}>
          <p className="wform-img-hint">
            🖼️ Adaugă imagini pentru a personaliza vinul în colecție. Poți încărca eticheta și/sau sticla. Imaginile sunt stocate privat în pivnița ta digitală.
          </p>
          <div className="wform-grid">
            <div className="wform-field">
              <ImageUpload
                label="Imagine etichetă"
                value={form.labelImageUrl}
                onChange={(url) => set('labelImageUrl', url || '')}
                folder="wines/labels"
              />
            </div>
            <div className="wform-field">
              <ImageUpload
                label="Imagine sticlă"
                value={form.bottleImageUrl}
                onChange={(url) => set('bottleImageUrl', url || '')}
                folder="wines/bottles"
              />
            </div>
          </div>
        </div>

        {/* ── SECTION 2: Detalii ── */}
        <div className={`wform-section ${section === 2 ? 'active' : ''}`}>
          <div className="wform-grid">
            <div className="wform-field">
              <label className="wform-label">Alcool (%)</label>
              <input className="wform-input" type="number" step="0.1" min="0" max="100" placeholder="ex. 13.5" value={form.alcoholPercentage} onChange={e => set('alcoholPercentage', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label">Cantitate (sticle)</label>
              <input className="wform-input" type="number" min="0" placeholder="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label">Mărime sticlă</label>
              <select className="wform-select" value={form.bottleSize} onChange={e => set('bottleSize', e.target.value)}>
                {BOTTLE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div className="wform-field">
              <label className="wform-label">Temperatură servire</label>
              <input className="wform-input" placeholder="ex. 16-18°C" value={form.servingTemperature} onChange={e => set('servingTemperature', e.target.value)} />
            </div>

            <div className="wform-field wform-full">
              <label className="wform-label">Soiuri de struguri</label>
              <input className="wform-input" placeholder="ex. Cabernet Sauvignon, Merlot (separate prin virgulă)" value={form.grapeVarieties} onChange={e => set('grapeVarieties', e.target.value)} />
            </div>

            <div className="wform-field wform-full">
              <label className="wform-label">Asocieri gastronomice</label>
              <input className="wform-input" placeholder="ex. Vită, Brânzeturi maturate (separate prin virgulă)" value={form.foodPairing} onChange={e => set('foodPairing', e.target.value)} />
            </div>

            <div className="wform-field wform-full">
              <label className="wform-label">Potențial de maturare</label>
              <input className="wform-input" placeholder="ex. 5-10 ani" value={form.agingPotential} onChange={e => set('agingPotential', e.target.value)} />
            </div>

            <div className="wform-field wform-full">
              <label className="wform-label">Favorit</label>
              <label className="wform-check-wrap">
                <input type="checkbox" checked={form.isFavorite} onChange={e => set('isFavorite', e.target.checked)} />
                <div className={`wform-check-box ${form.isFavorite ? 'checked' : ''}`}>
                  {form.isFavorite && '✓'}
                </div>
                <span className="wform-check-label">Adaugă la favorite ❤️</span>
              </label>
            </div>
          </div>
        </div>

        {/* ── SECTION 3: Stocare & Preț ── */}
        <div className={`wform-section ${section === 3 ? 'active' : ''}`}>
          <div className="wform-grid">
            <div className="wform-field">
              <label className="wform-label">Preț achiziție (€)</label>
              <input className="wform-input" type="number" step="0.01" min="0" placeholder="ex. 45.00" value={form.purchasePrice} onChange={e => set('purchasePrice', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label">Valoare estimată (€)</label>
              <input className="wform-input" type="number" step="0.01" min="0" placeholder="ex. 80.00" value={form.estimatedValue} onChange={e => set('estimatedValue', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label">Data achiziției</label>
              <input className="wform-input" type="date" value={form.purchaseDate} onChange={e => set('purchaseDate', e.target.value)} />
            </div>

            <div className="wform-field">
              <label className="wform-label">Locație pivniță</label>
              <input className="wform-input" placeholder="ex. Raft A, Rândul 3" value={form.cellarLocation} onChange={e => set('cellarLocation', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── SECTION 4: Degustare ── */}
        <div className={`wform-section ${section === 4 ? 'active' : ''}`}>
          <div className="wform-grid">
            <div className="wform-field wform-full">
              <label className="wform-label">Rating personal</label>
              <div className="wform-stars">
                {[1, 2, 3, 4, 5].map(n => (
                  <span
                    key={n}
                    className={`wform-star ${parseInt(form.rating) >= n ? 'filled' : ''}`}
                    onClick={() => set('rating', form.rating == n ? '' : n.toString())}
                  >★</span>
                ))}
                {form.rating && (
                  <span style={{ fontSize: '0.75rem', color: 'rgba(245,230,232,0.4)', alignSelf: 'center', marginLeft: '0.5rem' }}>
                    {form.rating}/5
                  </span>
                )}
              </div>
            </div>

            <div className="wform-field wform-full">
              <label className="wform-label">Notițe de degustare</label>
              <textarea
                className="wform-textarea"
                placeholder="Descrie culoarea, aroma, gustul, finisajul..."
                value={form.tastingNotes}
                onChange={e => set('tastingNotes', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="wform-nav">
          <button
            type="button"
            className="wform-btn-back"
            onClick={() => section > 0 ? setSection(s => s - 1) : router.push('/wines')}
          >
            ← {section === 0 ? 'Înapoi' : 'Anterior'}
          </button>

          <div className="wform-progress">
            {SECTIONS.map((_, i) => (
              <div key={i} className={`wform-prog-dot ${i === section ? 'active' : i < section ? 'done' : ''}`} />
            ))}
          </div>

          {section < SECTIONS.length - 1 ? (
            <button type="button" className="wform-btn-next" onClick={() => setSection(s => s + 1)}>
              <span>Continuă →</span>
            </button>
          ) : (
            <button type="submit" className="wform-btn-next" disabled={loading}>
              {loading
                ? <span><span className="wform-spinner" />{isEdit ? 'Se salvează...' : 'Se adaugă...'}</span>
                : <span>{isEdit ? '💾 Salvează' : '🍷 Adaugă în colecție'}</span>
              }
            </button>
          )}
        </div>
      </form>
    </>
  );
}