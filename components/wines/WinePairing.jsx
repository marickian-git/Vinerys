'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { getWinePairing } from '@/utils/actions';

// HOME-003: „Ce gătesc cu el?” — 3 preparate, temperatură și decantare, din cache sau generate la cerere
export default function WinePairing({ wineId, initialPairing = null }) {
  const [pairing, setPairing] = useState(initialPairing);
  const [loading, setLoading] = useState(false);

  const load = async (refresh = false) => {
    setLoading(true);
    try {
      const result = await getWinePairing(wineId, { refresh });
      if (result?.error) throw new Error(result.error);
      setPairing(result.pairing);
    } catch (error) {
      toast.error(error.message || 'Nu am putut genera sugestiile');
    } finally {
      setLoading(false);
    }
  };

  const buttonStyle = {
    padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid rgba(196,69,105,0.4)', background: 'transparent',
    color: '#f5e6e8', fontFamily: 'inherit', fontSize: '0.8rem', cursor: 'pointer',
  };

  if (!pairing) {
    return (
      <button type="button" onClick={() => load(false)} disabled={loading} style={buttonStyle}>
        {loading ? 'Sommelierul se gândește…' : 'Ce gătesc cu el?'}
      </button>
    );
  }

  const facts = [
    pairing.servingTemperature && `Servire: ${pairing.servingTemperature.min}–${pairing.servingTemperature.max} °C`,
    pairing.decantMinutes > 0 ? `Decantare: ${pairing.decantMinutes} min` : 'Fără decantare',
    pairing.glass && `Pahar: ${pairing.glass}`,
  ].filter(Boolean);

  return (
    <div>
      <ol style={{ margin: 0, paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {pairing.dishes.map((dish) => (
          <li key={dish.name}>
            <strong style={{ fontWeight: 500 }}>{dish.name}</strong>
            {dish.why && <span style={{ display: 'block', fontSize: '0.8rem', color: 'rgba(245,230,232,0.65)' }}>{dish.why}</span>}
          </li>
        ))}
      </ol>
      <p style={{ fontSize: '0.8rem', color: 'rgba(245,230,232,0.75)', margin: '0.9rem 0 0.4rem' }}>{facts.join(' · ')}</p>
      {pairing.tip && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: 'rgba(245,230,232,0.65)', margin: '0 0 0.8rem' }}>{pairing.tip}</p>}
      <button type="button" onClick={() => load(true)} disabled={loading} style={{ ...buttonStyle, fontSize: '0.72rem', padding: '0.4rem 0.8rem' }}>
        {loading ? 'Se regenerează…' : 'Alte sugestii'}
      </button>
      <span style={{ fontSize: '0.7rem', color: 'rgba(245,230,232,0.5)', marginLeft: '0.6rem' }}>Generat de AI</span>
    </div>
  );
}
