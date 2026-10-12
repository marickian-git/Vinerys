'use client';

import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';

const KEY = 'vinerys:followups-dismissed';

// localStorage citit fără efect (fără flash și fără hydration mismatch): pe server nu afișăm nimic
const subscribe = (callback) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};
const readStored = () => {
  try {
    return localStorage.getItem(KEY) || '[]';
  } catch {
    return '[]';
  }
};

// HOME-005: „Cum a fost?” pentru sticlele deschise ieri sau în ultimele zile, fără degustare notată
export default function FollowUpBanner({ items = [] }) {
  const stored = useSyncExternalStore(subscribe, readStored, () => null);
  const [local, setLocal] = useState([]);
  if (stored === null) return null;
  let saved = [];
  try { saved = JSON.parse(stored); } catch { /* valoare coruptă: o ignorăm */ }
  const dismissed = [...saved, ...local];
  const keyOf = (item) => `${item.wineId}:${new Date(item.at).toISOString()}`;
  const visible = items.filter((item) => !dismissed.includes(keyOf(item))).slice(0, 3);
  if (!visible.length) return null;

  const dismiss = (item) => {
    setLocal((current) => [...current, keyOf(item)]);
    try { localStorage.setItem(KEY, JSON.stringify([...saved, keyOf(item)].slice(-50))); } catch { /* fără stocare: dispare doar până la reload */ }
  };

  return (
    <section aria-label="Cum a fost?" style={{ margin: '0 0 1.25rem', padding: '1rem 1.25rem', borderRadius: 14, background: 'rgba(196,69,105,0.1)', border: '1px solid rgba(196,69,105,0.3)', color: '#f5e6e8' }}>
      {visible.map((item) => (
        <div key={keyOf(item)} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', padding: '0.35rem 0' }}>
          <span style={{ flexGrow: 1, fontSize: '0.9rem' }}>
            🍷 Ai deschis <strong>{item.wineName}</strong> {new Date(item.at).toLocaleDateString('ro-RO', { weekday: 'long' })}. Cum a fost?
          </span>
          <Link href={`/wines/${item.wineId}#jurnal`} style={{ padding: '0.4rem 0.9rem', borderRadius: 999, background: '#8b1a2e', color: '#f5e6e8', textDecoration: 'none', fontSize: '0.8rem' }}>Notează</Link>
          <button type="button" onClick={() => dismiss(item)} style={{ background: 'none', border: 'none', color: 'rgba(245,230,232,0.6)', cursor: 'pointer', fontSize: '0.8rem' }}>Nu acum</button>
        </div>
      ))}
    </section>
  );
}
