'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { parseWineText, quickAddWine } from '@/utils/actions';

const TYPE_LABELS = { RED: 'Roșu', WHITE: 'Alb', ROSE: 'Rosé', SPARKLING: 'Spumant', DESSERT: 'Desert', FORTIFIED: 'Fortifiat' };
const CURRENCY_OPTIONS = ['RON', 'EUR', 'USD'];

function speechRecognition() {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

// AI-007: „Am luat 6 Fetească Neagră 2021 de la Davino cu 80 lei” → previzualizare editabilă → vin în pivniță
export default function VoiceAdd() {
  const [text, setText] = useState('');
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState({ loading: false, wine: null, source: null, error: null, saved: null });
  const recognition = useRef(null);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- API-ul există doar în browser, după hidratare
  useEffect(() => setSupported(Boolean(speechRecognition())), []);
  useEffect(() => () => recognition.current?.abort(), []);

  const parse = async (value) => {
    const input = (value ?? text).trim();
    if (!input) return;
    setState({ loading: true, wine: null, source: null, error: null, saved: null });
    const result = await parseWineText(input).catch(() => ({ error: 'Eroare de rețea' }));
    setState({ loading: false, wine: result.wine ?? null, source: result.source ?? null, error: result.error ?? null, saved: null });
  };

  const listen = () => {
    const Recognition = speechRecognition();
    if (!Recognition) return;
    if (listening) return recognition.current?.stop();
    const rec = new Recognition();
    rec.lang = 'ro-RO';
    rec.interimResults = true;
    rec.onresult = (event) => {
      const transcript = Array.from(event.results).map((r) => r[0].transcript).join(' ');
      setText(transcript);
      if (event.results[event.results.length - 1].isFinal) parse(transcript);
    };
    rec.onerror = (event) => setState((s) => ({ ...s, error: event.error === 'not-allowed' ? 'Permite accesul la microfon ca să dictezi.' : 'Nu te-am auzit. Încearcă din nou sau scrie.' }));
    rec.onend = () => setListening(false);
    recognition.current = rec;
    setListening(true);
    rec.start();
  };

  const update = (field, value) => setState((s) => ({ ...s, wine: { ...s.wine, [field]: value } }));

  const save = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    const wine = { ...state.wine, vintage: state.wine.vintage || undefined, purchasePrice: state.wine.purchasePrice === '' ? undefined : state.wine.purchasePrice };
    const result = await quickAddWine(wine).catch(() => ({ error: 'Eroare de rețea' }));
    if (result.error) return setState((s) => ({ ...s, loading: false, error: result.error }));
    setText('');
    setState({ loading: false, wine: null, source: null, error: null, saved: result });
  };

  const field = { minWidth: 0, background: '#1a0f12', color: '#f5e6e8', border: '1px solid rgba(196,69,105,0.35)', borderRadius: 10, padding: '0.6rem 0.8rem', fontSize: '0.95rem', width: '100%', boxSizing: 'border-box' };
  const label = { display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(245,230,232,0.6)' };
  const button = { padding: '0.7rem 1.1rem', borderRadius: 10, border: 'none', background: '#8b1a2e', color: '#f5e6e8', fontSize: '0.9rem', cursor: 'pointer' };
  const wine = state.wine;

  return (
    <section aria-labelledby="voice-add-title" style={{ border: '1px solid rgba(196,69,105,0.2)', borderRadius: 16, padding: '1.25rem', marginBottom: '2rem', color: '#f5e6e8' }}>
      <h2 id="voice-add-title" style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', fontWeight: 500 }}>Adăugare rapidă</h2>
      <p style={{ margin: '0 0 0.9rem', fontSize: '0.82rem', color: 'rgba(245,230,232,0.6)' }}>
        {supported ? 'Apasă pe microfon și spune' : 'Scrie'} ce ai cumpărat, ex. „6 Fetească Neagră 2021 de la Davino cu 80 lei”.
      </p>
      <form onSubmit={(e) => { e.preventDefault(); parse(); }} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {supported && (
          <button type="button" onClick={listen} aria-pressed={listening} aria-label={listening ? 'Oprește dictarea' : 'Dictează'} style={{ ...button, background: listening ? '#c44569' : '#3a1c24', minWidth: 48 }}>
            {listening ? '■' : '🎤'}
          </button>
        )}
        <label htmlFor="voice-text" style={{ position: 'absolute', left: -9999 }}>Ce ai cumpărat?</label>
        <input id="voice-text" value={text} onChange={(e) => setText(e.target.value)} placeholder="6 Fetească Neagră 2021 de la Davino cu 80 lei" maxLength={300} style={{ ...field, flex: '1 1 220px', width: 'auto' }} />
        <button type="submit" disabled={state.loading || !text.trim()} style={button}>{state.loading && !wine ? 'Înțeleg…' : 'Interpretează'}</button>
      </form>

      {state.error && <p role="alert" style={{ color: '#ff8f8f', margin: '0.8rem 0 0' }}>{state.error}</p>}
      {state.saved && (
        <p role="status" style={{ margin: '0.8rem 0 0' }}>
          Adăugat: <Link href={`/wines/${state.saved.id}`} style={{ color: '#d97a95' }}>{state.saved.name}</Link>
        </p>
      )}

      {wine && (
        <div aria-live="polite" style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.7rem' }}>
          <label style={{ ...label, gridColumn: '1 / -1' }}>Nume<input value={wine.name ?? ''} onChange={(e) => update('name', e.target.value)} style={field} /></label>
          <label style={label}>Producător<input value={wine.producer ?? ''} onChange={(e) => update('producer', e.target.value)} style={field} /></label>
          <label style={label}>An<input type="number" value={wine.vintage ?? ''} onChange={(e) => update('vintage', e.target.value ? Number(e.target.value) : '')} style={field} /></label>
          <label style={label}>Sticle<input type="number" min="1" value={wine.quantity ?? 1} onChange={(e) => update('quantity', Number(e.target.value))} style={field} /></label>
          <label style={label}>Tip
            <select value={wine.type} onChange={(e) => update('type', e.target.value)} style={field}>
              {Object.entries(TYPE_LABELS).map(([value, text]) => <option key={value} value={value}>{text}</option>)}
            </select>
          </label>
          <label style={label}>Preț / sticlă<input type="number" min="0" step="0.01" value={wine.purchasePrice ?? ''} onChange={(e) => update('purchasePrice', e.target.value === '' ? '' : Number(e.target.value))} style={field} /></label>
          <label style={label}>Monedă
            <select value={wine.currency ?? 'RON'} onChange={(e) => update('currency', e.target.value)} style={field}>
              {CURRENCY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={save} disabled={state.loading || !wine.name?.trim()} style={button}>{state.loading ? 'Salvez…' : 'Adaugă în pivniță'}</button>
            <button type="button" onClick={() => setState((s) => ({ ...s, wine: null }))} style={{ ...button, background: 'transparent', border: '1px solid rgba(196,69,105,0.35)' }}>Renunță</button>
            <span style={{ fontSize: '0.75rem', color: 'rgba(245,230,232,0.6)' }}>{state.source === 'ai' ? 'Interpretat cu AI' : 'Interpretat fără AI: verifică câmpurile'}</span>
          </div>
        </div>
      )}
    </section>
  );
}
