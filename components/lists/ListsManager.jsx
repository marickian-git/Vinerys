'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { addToList, removeFromList, removeList, saveList, toggleListItemPurchased } from '@/utils/actions';

const KIND_LABELS = { WISHLIST: 'Wishlist', RECOMMENDATIONS: 'Recomandări', GIFTS: 'Listă de cadouri' };
const field = { background: '#1a0f12', color: '#f5e6e8', border: '1px solid rgba(196,69,105,0.3)', borderRadius: 8, padding: '0.5rem 0.65rem', fontSize: '0.88rem', fontFamily: 'inherit' };
const small = { background: 'none', border: '1px solid rgba(196,69,105,0.35)', color: '#f5e6e8', borderRadius: 999, padding: '0.3rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' };

function NewListForm({ onDone }) {
  const [form, setForm] = useState({ name: '', kind: 'WISHLIST' });
  const submit = async (event) => {
    event.preventDefault();
    const result = await saveList(form);
    if (result.error) return toast.error(result.error);
    setForm({ name: '', kind: 'WISHLIST' });
    onDone(result.list.id);
  };
  return (
    <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'flex-end' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', flexGrow: 1 }}>Numele listei
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="ex. De Crăciun" maxLength={80} style={field} />
      </label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem' }}>Tip
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} style={field}>
          {Object.entries(KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <button type="submit" style={{ ...field, background: '#8b1a2e', borderColor: '#8b1a2e', cursor: 'pointer' }}>Creează lista</button>
    </form>
  );
}

function AddItemForm({ listId, wines, onDone }) {
  const [item, setItem] = useState({ wineId: '', name: '', producer: '', vintage: '', note: '', url: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const result = await addToList(listId, { ...item, wineId: item.wineId || null }).catch(() => ({ error: 'Eroare de rețea' }));
    setSaving(false);
    if (result.error) return setError(result.error);
    setItem({ wineId: '', name: '', producer: '', vintage: '', note: '', url: '' });
    onDone();
  };
  return (
    <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.5rem', marginTop: '0.75rem' }}>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem' }}>Din pivniță
        <select value={item.wineId} onChange={(e) => setItem({ ...item, wineId: e.target.value })} style={field}>
          <option value="">— vin nou —</option>
          {wines.map((wine) => <option key={wine.id} value={wine.id}>{wine.name}{wine.vintage ? ` ${wine.vintage}` : ''}</option>)}
        </select>
      </label>
      {!item.wineId && (
        <>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem' }}>Vin<input value={item.name} onChange={(e) => setItem({ ...item, name: e.target.value })} placeholder="ex. Barolo Monfortino" style={field} /></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem' }}>Producător<input value={item.producer} onChange={(e) => setItem({ ...item, producer: e.target.value })} style={field} /></label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem' }}>An<input type="number" value={item.vintage} onChange={(e) => setItem({ ...item, vintage: e.target.value })} style={field} /></label>
        </>
      )}
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem' }}>Notă<input value={item.note} onChange={(e) => setItem({ ...item, note: e.target.value })} placeholder="de ce / pentru cine" style={field} /></label>
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem' }}>Link magazin<input value={item.url} onChange={(e) => setItem({ ...item, url: e.target.value })} placeholder="https://…" style={field} /></label>
      <button type="submit" disabled={saving} style={{ ...field, background: '#8b1a2e', borderColor: '#8b1a2e', cursor: 'pointer', alignSelf: 'end' }}>{saving ? 'Se adaugă…' : 'Adaugă'}</button>
      {error && <p role="alert" style={{ gridColumn: '1 / -1', color: '#ff8f8f', margin: 0, fontSize: '0.82rem' }}>{error}</p>}
    </form>
  );
}

// SOCIAL-003: listele utilizatorului, cu publicare prin link și urmărirea cadourilor
export default function ListsManager({ lists, wines }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  const [open, setOpen] = useState(lists[0]?.id ?? null);

  const togglePublic = async (list) => {
    const result = await saveList({ name: list.name, description: list.description, kind: list.kind, isPublic: !list.isPublic }, list.id);
    if (result.error) return toast.error(result.error);
    refresh();
  };
  const copy = async (url) => {
    try { await navigator.clipboard.writeText(url); toast.success('Link copiat'); } catch { toast.error(url); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <NewListForm onDone={(id) => { setOpen(id); refresh(); }} />
      {lists.length === 0 && <p style={{ opacity: 0.7 }}>Încă nu ai liste. Începe cu un wishlist sau o listă de cadouri pentru Crăciun.</p>}
      {lists.map((list) => (
        <section key={list.id} style={{ border: '1px solid rgba(196,69,105,0.22)', borderRadius: 14, padding: '1rem 1.2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <button type="button" onClick={() => setOpen(open === list.id ? null : list.id)} aria-expanded={open === list.id}
              style={{ background: 'none', border: 'none', color: '#f5e6e8', fontSize: '1.1rem', cursor: 'pointer', padding: 0, flexGrow: 1, textAlign: 'left' }}>
              {list.name} <span style={{ fontSize: '0.75rem', opacity: 0.6 }}>· {KIND_LABELS[list.kind]} · {list.items.length}</span>
            </button>
            <button type="button" style={small} onClick={() => togglePublic(list)} aria-pressed={list.isPublic}>{list.isPublic ? 'Publică' : 'Privată'}</button>
            {list.isPublic && <button type="button" style={small} onClick={() => copy(list.shareUrl)}>Copiază linkul</button>}
            <button type="button" style={small} onClick={async () => { if (window.confirm(`Ștergi lista „${list.name}”?`)) { await removeList(list.id); refresh(); } }}>Șterge</button>
          </div>
          {list.isPublic && (
            <input readOnly value={list.shareUrl} aria-label={`Link public pentru ${list.name}`} onFocus={(e) => e.target.select()}
              style={{ ...field, width: '100%', boxSizing: 'border-box', marginTop: '0.6rem', fontSize: '0.78rem', opacity: 0.85 }} />
          )}
          {open === list.id && (
            <>
              <ul style={{ listStyle: 'none', margin: '0.75rem 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {list.items.map((item) => (
                  <li key={item.id} style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: '0.9rem', opacity: item.purchased ? 0.55 : 1 }}>
                    <input type="checkbox" checked={item.purchased} onChange={async () => { await toggleListItemPurchased(item.id); refresh(); }} aria-label={`Cumpărat: ${item.name}`} />
                    <span style={{ flexGrow: 1, textDecoration: item.purchased ? 'line-through' : 'none' }}>
                      {item.name}{item.vintage ? ` ${item.vintage}` : ''}{item.producer ? ` · ${item.producer}` : ''}
                      {item.note && <span style={{ opacity: 0.65 }}> — {item.note}</span>}
                    </span>
                    {list.kind === 'GIFTS' && item.reserved && <span style={{ fontSize: '0.72rem', color: '#e8b04a' }}>rezervat 🎁</span>}
                    {item.url && <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: '#d97a95', fontSize: '0.75rem' }}>magazin ↗</a>}
                    <button type="button" aria-label={`Scoate ${item.name}`} onClick={async () => { await removeFromList(item.id); refresh(); }} style={{ background: 'none', border: 'none', color: 'rgba(245,230,232,0.6)', cursor: 'pointer' }}>✕</button>
                  </li>
                ))}
              </ul>
              <AddItemForm listId={list.id} wines={wines} onDone={refresh} />
            </>
          )}
        </section>
      ))}
    </div>
  );
}
