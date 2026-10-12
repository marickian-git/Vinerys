'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { deleteSavedFilter, saveFilter } from '@/utils/actions';

// CELLAR-009: filtrele salvate ca scurtături deasupra listei; filtrul curent se poate salva cu un nume
export default function SavedFilters({ initial = [] }) {
  const params = useSearchParams();
  const [filters, setFilters] = useState(initial);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const current = Object.fromEntries([...params.entries()].filter(([key, value]) => value && !['page', 'pageSize'].includes(key)));
  const hasActive = Object.keys(current).some((key) => key !== 'sort');

  const save = async (event) => {
    event.preventDefault();
    const result = await saveFilter(name, current);
    if (result?.error) return toast.error(result.error);
    setFilters((list) => [...list.filter((f) => f.id !== result.filter.id), result.filter]);
    setNaming(false);
    setName('');
    toast.success('Filtru salvat');
  };

  const remove = async (id) => {
    await deleteSavedFilter(id);
    setFilters((list) => list.filter((f) => f.id !== id));
  };

  if (!filters.length && !hasActive) return null;
  const chip = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0.35rem 0.75rem', borderRadius: 999, border: '1px solid rgba(196,69,105,0.35)', color: '#f5e6e8', fontSize: '0.75rem', textDecoration: 'none', background: 'transparent' };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', margin: '0 0 1.25rem' }}>
      {filters.map((filter) => (
        <span key={filter.id} style={chip}>
          <Link href={`/wines?${new URLSearchParams(filter.params).toString()}`} style={{ color: 'inherit', textDecoration: 'none' }}>{filter.name}</Link>
          <button type="button" aria-label={`Șterge filtrul ${filter.name}`} onClick={() => remove(filter.id)} style={{ background: 'none', border: 'none', color: 'rgba(245,230,232,0.6)', cursor: 'pointer', padding: 0, fontSize: '0.9rem' }}>×</button>
        </span>
      ))}
      {hasActive && !naming && (
        <button type="button" onClick={() => setNaming(true)} style={{ ...chip, cursor: 'pointer', borderStyle: 'dashed' }}>+ Salvează filtrul</button>
      )}
      {naming && (
        <form onSubmit={save} style={{ display: 'inline-flex', gap: 6 }}>
          <label htmlFor="saved-filter-name" style={{ position: 'absolute', left: -9999 }}>Numele filtrului</label>
          <input id="saved-filter-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="ex. De băut weekendul ăsta" maxLength={40}
            style={{ ...chip, borderRadius: 8, background: '#1a0f12', minWidth: 200 }} />
          <button type="submit" style={{ ...chip, cursor: 'pointer', background: '#8b1a2e', borderColor: '#8b1a2e' }}>Salvează</button>
        </form>
      )}
    </div>
  );
}
