'use client';

import { useState } from 'react';
import { reserveGift } from '@/utils/actions';

export default function ReserveGiftButton({ shareId, itemId, reserved }) {
  const [state, setState] = useState(reserved ? 'reserved' : 'idle');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  if (state === 'reserved') return <span style={{ fontSize: '0.8rem', color: '#e8b04a' }}>Rezervat 🎁</span>;
  if (state === 'mine') return <span role="status" style={{ fontSize: '0.8rem', color: '#7fc79a' }}>L-ai rezervat. Mulțumim!</span>;
  if (state === 'idle') {
    return <button type="button" onClick={() => setState('form')} style={{ padding: '0.45rem 0.9rem', borderRadius: 999, border: 'none', background: '#8b1a2e', color: '#f5e6e8', cursor: 'pointer', fontSize: '0.82rem' }}>Îl dăruiesc eu</button>;
  }
  const submit = async (event) => {
    event.preventDefault();
    const result = await reserveGift(shareId, itemId, name);
    if (result.error) {
      setError(result.error);
      if (result.error.includes('deja rezervat')) setState('reserved');
      return;
    }
    setState('mine');
  };
  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      <label htmlFor={`reserve-${itemId}`} style={{ position: 'absolute', left: -9999 }}>Numele tău</label>
      <input id={`reserve-${itemId}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Numele tău" maxLength={60}
        style={{ background: '#1a0f12', color: '#f5e6e8', border: '1px solid rgba(196,69,105,0.3)', borderRadius: 8, padding: '0.4rem 0.6rem', fontSize: '0.85rem' }} />
      <button type="submit" style={{ padding: '0.4rem 0.8rem', borderRadius: 8, border: 'none', background: '#8b1a2e', color: '#f5e6e8', cursor: 'pointer', fontSize: '0.82rem' }}>Rezervă</button>
      {error && <span role="alert" style={{ color: '#ff8f8f', fontSize: '0.78rem', flexBasis: '100%' }}>{error}</span>}
    </form>
  );
}
