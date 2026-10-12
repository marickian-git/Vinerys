'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { restockWine } from '@/utils/actions';

// INT-003: apare când s-a terminat un vin care ți-a plăcut
export default function ReorderCard({ wineId, links }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState('6');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);

  const restock = async (event) => {
    event.preventDefault();
    setSaving(true);
    const result = await restockWine(wineId, { quantity, purchasePrice: price });
    setSaving(false);
    if (result?.error) return toast.error(result.error);
    toast.success('Vinul e din nou în pivniță 🍷');
    router.refresh();
  };

  const input = { background: '#1a0f12', color: '#f5e6e8', border: '1px solid rgba(196,69,105,0.3)', borderRadius: 8, padding: '0.45rem 0.6rem', width: 90, fontSize: '0.85rem' };
  return (
    <div>
      <p style={{ margin: '0 0 0.75rem', fontSize: '0.9rem' }}>Ți-a plăcut și s-a terminat. Îl cumperi din nou?</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {links.map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer"
            style={{ padding: '0.45rem 0.9rem', borderRadius: 999, border: '1px solid rgba(196,69,105,0.4)', color: '#f5e6e8', textDecoration: 'none', fontSize: '0.8rem' }}>
            {link.label} ↗
          </a>
        ))}
      </div>
      <form onSubmit={restock} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'flex-end' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem' }}>
          Sticle cumpărate
          <input type="number" min="1" max="500" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={input} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem' }}>
          Preț / sticlă (opțional)
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} style={input} />
        </label>
        <button type="submit" disabled={saving} style={{ padding: '0.55rem 1rem', borderRadius: 8, border: 'none', background: '#8b1a2e', color: '#f5e6e8', cursor: 'pointer', fontSize: '0.85rem' }}>
          {saving ? 'Se salvează…' : 'L-am cumpărat din nou'}
        </button>
      </form>
    </div>
  );
}
