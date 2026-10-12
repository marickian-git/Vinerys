'use client';

import { useState } from 'react';
import Link from 'next/link';
import { suggestWinesForDish } from '@/utils/actions';

const EXAMPLES = ['Miel la cuptor cu rozmarin', 'Sarmale cu mămăligă', 'Somon la grătar', 'Paste carbonara', 'Brânzeturi maturate'];

// HOME-004: „Ce gătesc azi?” → top 3 sticle din pivniță, cu explicație
export default function DishPairing() {
  const [dish, setDish] = useState('');
  const [state, setState] = useState({ loading: false, data: null, error: null });

  const ask = async (value) => {
    const text = (value ?? dish).trim();
    if (!text) return;
    setDish(text);
    setState({ loading: true, data: null, error: null });
    const result = await suggestWinesForDish(text).catch(() => ({ error: 'Eroare de rețea' }));
    setState({ loading: false, data: result.error ? null : result, error: result.error ?? null });
  };

  const field = { flexGrow: 1, minWidth: 0, background: '#1a0f12', color: '#f5e6e8', border: '1px solid rgba(196,69,105,0.35)', borderRadius: 10, padding: '0.8rem 1rem', fontSize: '1rem' };
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); ask(); }} style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <label htmlFor="dish" style={{ position: 'absolute', left: -9999 }}>Ce gătești?</label>
        <input id="dish" value={dish} onChange={(e) => setDish(e.target.value)} placeholder="ex. miel la cuptor cu rozmarin" maxLength={200} style={field} />
        <button type="submit" disabled={state.loading} style={{ padding: '0.8rem 1.3rem', borderRadius: 10, border: 'none', background: '#8b1a2e', color: '#f5e6e8', fontSize: '0.95rem', cursor: 'pointer' }}>
          {state.loading ? 'Caut…' : 'Ce vin deschid?'}
        </button>
      </form>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.75rem' }}>
        {EXAMPLES.map((example) => (
          <button key={example} type="button" onClick={() => ask(example)} style={{ padding: '0.35rem 0.8rem', borderRadius: 999, border: '1px solid rgba(196,69,105,0.3)', background: 'transparent', color: 'rgba(245,230,232,0.8)', fontSize: '0.78rem', cursor: 'pointer' }}>
            {example}
          </button>
        ))}
      </div>

      {state.error && <p role="alert" style={{ color: '#ff8f8f', marginTop: '1rem' }}>{state.error}</p>}
      {state.data && (
        <section aria-live="polite" style={{ marginTop: '1.5rem' }}>
          {state.data.results.length === 0 ? (
            <p>Nu am găsit în pivniță un vin potrivit pentru „{state.data.dish}”.{state.data.source === 'saved' && ' Cu un agent AI configurat, sugestiile sunt mai bune.'}</p>
          ) : (
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {state.data.results.map(({ wine, reason, match, urgency }, index) => (
                <li key={wine.id} style={{ border: '1px solid rgba(196,69,105,0.25)', borderRadius: 14, padding: '1rem 1.2rem' }}>
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#d97a95' }}>{index === 0 ? 'Recomandarea' : `Varianta ${index + 1}`}</div>
                  <Link href={`/wines/${wine.id}`} style={{ color: '#f5e6e8', fontSize: '1.15rem', fontWeight: 500 }}>{wine.name}{wine.vintage ? ` ${wine.vintage}` : ''}</Link>
                  {reason && <p style={{ margin: '0.35rem 0 0', fontSize: '0.9rem' }}>{reason}</p>}
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', opacity: 0.65 }}>
                    Potrivire {Math.round(match * 100)}% · {urgency >= 0.9 ? 'de băut acum' : urgency >= 0.6 ? 'spre finalul ferestrei' : 'în fereastră'}
                    {wine.cellarLocation ? ` · 📍 ${wine.cellarLocation}` : ''}
                  </p>
                </li>
              ))}
            </ol>
          )}
          <p style={{ fontSize: '0.72rem', opacity: 0.55, marginTop: '0.75rem' }}>
            {state.data.source === 'ai' ? 'Generat de AI, doar din vinurile tale.' : 'Pe baza asocierilor salvate pe vinuri.'}
            {state.data.aiUnavailable && ` ${state.data.aiUnavailable}`}
          </p>
        </section>
      )}
    </div>
  );
}
