'use client';

import { useState } from 'react';
import Link from 'next/link';
import { consumeWine } from '@/utils/actions';

// CELLAR-002: după scanarea QR-ului, deschiderea sticlei e un singur tap (scanarea e deja confirmarea)
export default function QuickConsume({ wineId, quantity }) {
  const [remaining, setRemaining] = useState(quantity);
  const [state, setState] = useState('idle'); // idle | saving | done | error
  const [error, setError] = useState('');

  const consume = async () => {
    setState('saving');
    const result = await consumeWine(wineId, 1).catch(() => ({ error: 'Eroare de rețea' }));
    if (result?.success) {
      setRemaining(result.remaining);
      setState('done');
    } else {
      setError(result?.error || 'Nu am putut salva');
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <p role="status" style={{ fontSize: '1.2rem', margin: 0 }}>Noroc! 🥂 {remaining > 0 ? `Mai ai ${remaining} ${remaining === 1 ? 'sticlă' : 'sticle'}.` : 'A fost ultima sticlă.'}</p>
        <Link href={`/wines/${wineId}#jurnal`} style={{ padding: '0.9rem', borderRadius: 999, background: '#f5e6e8', color: '#2a0d16', textDecoration: 'none', fontWeight: 500 }}>Notează cum a fost</Link>
      </div>
    );
  }
  if (remaining <= 0) return <p style={{ margin: 0 }}>Nu mai ai sticle din acest vin în pivniță.</p>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <button type="button" onClick={consume} disabled={state === 'saving'}
        style={{ padding: '1.2rem', borderRadius: 999, border: 'none', background: '#8b1a2e', color: '#f5e6e8', fontSize: '1.15rem', fontWeight: 500, cursor: 'pointer' }}>
        {state === 'saving' ? 'Se salvează…' : 'Deschid o sticlă'}
      </button>
      <span style={{ fontSize: '0.8rem', color: 'rgba(245,230,232,0.6)' }}>{remaining} {remaining === 1 ? 'sticlă' : 'sticle'} în pivniță</span>
      {state === 'error' && <p role="alert" style={{ color: '#ff8f8f', margin: 0 }}>{error}</p>}
    </div>
  );
}
