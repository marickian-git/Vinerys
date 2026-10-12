'use client';

import toast from 'react-hot-toast';

// Distribuie rezumatul: meniul nativ de share pe telefon, altfel copiere în clipboard
export default function WrappedShare({ text }) {
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: 'Vinerys Wrapped', text });
      else {
        await navigator.clipboard.writeText(text);
        toast.success('Rezumatul a fost copiat');
      }
    } catch (error) {
      if (error?.name !== 'AbortError') toast.error('Nu am putut distribui');
    }
  };
  return (
    <button type="button" onClick={share} style={{ marginTop: '0.5rem', padding: '0.9rem', borderRadius: 999, border: 'none', background: '#f5e6e8', color: '#2a0d16', fontSize: '1rem', fontWeight: 500, cursor: 'pointer' }}>
      Distribuie anul tău
    </button>
  );
}
