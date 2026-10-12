'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import ImageUpload from '@/components/wines/ImageUpload';
import { createTasting, deleteTasting } from '@/utils/actions';
import { getDisplayImageUrl } from '@/utils/mediaUrl';

// CELLAR-003: jurnalul de degustări al unui vin (sau al tuturor, pe /tastings) + formularul de degustare nouă
const field = { background: '#1a0f12', color: '#f5e6e8', border: '1px solid rgba(196,69,105,0.3)', borderRadius: 8, padding: '0.5rem 0.65rem', fontSize: '0.85rem', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' };
const labelStyle = { display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.72rem', color: 'rgba(245,230,232,0.75)' };
const today = () => new Date().toISOString().slice(0, 10);
const splitList = (text) => text.split(',').map((item) => item.trim()).filter(Boolean);

export function TastingForm({ wineId, onSaved, initial = {} }) {
  const [form, setForm] = useState({ tastedAt: today(), rating: '', occasion: '', people: '', food: '', location: '', notes: '', aromas: '', photo: null, ...initial });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    const result = await createTasting({
      wineId,
      tastedAt: form.tastedAt,
      rating: form.rating,
      occasion: form.occasion,
      people: splitList(form.people),
      food: form.food,
      location: form.location,
      notes: form.notes,
      aromas: splitList(form.aromas),
      photoUrls: form.photo ? [form.photo] : [],
    });
    setSaving(false);
    if (result?.error) {
      if (typeof result.error === 'object') setErrors(result.error);
      return toast.error(typeof result.error === 'string' ? result.error : 'Verifică câmpurile');
    }
    toast.success('Degustare salvată');
    onSaved?.(result.tasting);
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem' }}>
      <fieldset style={{ gridColumn: '1 / -1', border: 'none', padding: 0, margin: 0 }}>
        <legend style={{ fontSize: '0.72rem', color: 'rgba(245,230,232,0.75)', marginBottom: 6 }}>Cum a fost?</legend>
        <div style={{ display: 'flex', gap: 6 }}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button key={value} type="button" aria-label={`${value} din 5`} aria-pressed={Number(form.rating) === value}
              onClick={() => set('rating', Number(form.rating) === value ? '' : String(value))}
              style={{ fontSize: '1.4rem', background: 'none', border: 'none', cursor: 'pointer', color: Number(form.rating) >= value ? '#e8b04a' : 'rgba(245,230,232,0.35)', padding: '0 2px' }}>★</button>
          ))}
        </div>
      </fieldset>
      <label style={labelStyle}>Data<input type="date" value={form.tastedAt} max={today()} onChange={(e) => set('tastedAt', e.target.value)} style={field} /></label>
      <label style={labelStyle}>Ocazie<input value={form.occasion} onChange={(e) => set('occasion', e.target.value)} placeholder="ex. Cină cu prietenii" style={field} /></label>
      <label style={labelStyle}>Cu cine<input value={form.people} onChange={(e) => set('people', e.target.value)} placeholder="Ana, Mihai" style={field} /></label>
      <label style={labelStyle}>Mâncare<input value={form.food} onChange={(e) => set('food', e.target.value)} placeholder="ex. Miel la cuptor" style={field} /></label>
      <label style={labelStyle}>Unde<input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="ex. Acasă" style={field} /></label>
      <label style={labelStyle}>Arome<input value={form.aromas} onChange={(e) => set('aromas', e.target.value)} placeholder="mure, vanilie, piper" style={field} /></label>
      <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>Note
        <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Ce ți-a plăcut, ce nu…" style={{ ...field, resize: 'vertical' }} />
        {errors.notes && <span style={{ color: '#ff8f8f' }}>{errors.notes[0]}</span>}
      </label>
      <div style={{ gridColumn: '1 / -1' }}>
        <ImageUpload label="Poză de la masă (opțional)" value={form.photo} onChange={(url) => set('photo', url)} folder="tastings" />
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <button type="submit" disabled={saving} style={{ padding: '0.65rem 1.3rem', borderRadius: 8, border: 'none', background: '#8b1a2e', color: '#f5e6e8', cursor: 'pointer', fontSize: '0.9rem' }}>
          {saving ? 'Se salvează…' : 'Salvează degustarea'}
        </button>
      </div>
    </form>
  );
}

function TastingItem({ tasting, showWine, onDelete }) {
  const meta = [
    new Date(tasting.tastedAt).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }),
    tasting.occasion, tasting.location, tasting.people?.length ? `cu ${tasting.people.join(', ')}` : null,
  ].filter(Boolean);
  return (
    <li style={{ listStyle: 'none', padding: '1rem 0', borderTop: '1px solid rgba(196,69,105,0.15)', display: 'flex', gap: '1rem' }}>
      {tasting.photoUrls?.[0] && (
        <img src={getDisplayImageUrl(tasting.photoUrls[0], { width: 480 })} alt="Poză de la degustare" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
      )}
      <div style={{ flexGrow: 1, minWidth: 0 }}>
        {showWine && (tasting.wine
          ? <Link href={`/wines/${tasting.wine.id}`} style={{ color: '#f5e6e8', fontWeight: 500 }}>{tasting.wine.name}</Link>
          : <span style={{ fontWeight: 500 }}>{tasting.wineName}</span>)}
        <div style={{ fontSize: '0.78rem', color: 'rgba(245,230,232,0.7)' }}>
          {tasting.rating ? <span aria-label={`${tasting.rating} din 5`} style={{ color: '#e8b04a', marginRight: 8 }}>{'★'.repeat(tasting.rating)}</span> : null}
          {meta.join(' · ')}
        </div>
        {tasting.food && <div style={{ fontSize: '0.82rem', marginTop: 4 }}>🍽 {tasting.food}</div>}
        {tasting.notes && <p style={{ fontSize: '0.88rem', margin: '0.4rem 0 0', whiteSpace: 'pre-line' }}>{tasting.notes}</p>}
        {tasting.aromas?.length > 0 && <div style={{ fontSize: '0.75rem', color: 'rgba(245,230,232,0.65)', marginTop: 4 }}>{tasting.aromas.join(' · ')}</div>}
      </div>
      {onDelete && (
        <button type="button" aria-label="Șterge degustarea" onClick={() => onDelete(tasting.id)} style={{ background: 'none', border: 'none', color: 'rgba(245,230,232,0.5)', cursor: 'pointer', alignSelf: 'flex-start' }}>✕</button>
      )}
    </li>
  );
}

export default function TastingJournal({ wineId = null, tastings = [], showWine = false }) {
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  const remove = async (id) => {
    if (!window.confirm('Ștergi degustarea?')) return;
    const result = await deleteTasting(id);
    if (result?.error) return toast.error(result.error);
    router.refresh();
  };

  return (
    <div>
      {wineId && (adding ? (
        <div style={{ marginBottom: '1rem' }}>
          <TastingForm wineId={wineId} onSaved={() => { setAdding(false); router.refresh(); }} />
        </div>
      ) : (
        <button type="button" onClick={() => setAdding(true)} style={{ padding: '0.55rem 1rem', borderRadius: 8, border: '1px solid rgba(196,69,105,0.4)', background: 'transparent', color: '#f5e6e8', cursor: 'pointer', fontSize: '0.82rem', marginBottom: '0.5rem' }}>
          + Adaugă degustare
        </button>
      ))}
      {tastings.length === 0 ? (
        <p style={{ fontSize: '0.82rem', color: 'rgba(245,230,232,0.6)' }}>Încă nicio degustare. Notează cum a fost, cu cine și la ce mâncare.</p>
      ) : (
        <ul style={{ margin: 0, padding: 0 }}>
          {tastings.map((tasting) => <TastingItem key={tasting.id} tasting={tasting} showWine={showWine} onDelete={remove} />)}
        </ul>
      )}
    </div>
  );
}
