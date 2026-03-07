'use client';

import { useState, useRef, useEffect } from 'react';
import { updateCellarName } from '@/utils/actions';

export default function CellarNameEditor({ initialName }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(initialName || 'Dashboard');
  const [saving, setSaving]   = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const save = async () => {
    const trimmed = value.trim();
    if (!trimmed) { setValue(initialName || 'Dashboard'); setEditing(false); return; }
    if (trimmed === (initialName || 'Dashboard')) { setEditing(false); return; }

    setSaving(true);
    const result = await updateCellarName(trimmed);
    setSaving(false);

    if (result?.error) {
      setValue(initialName || 'Dashboard');
    }
    setEditing(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter')  save();
    if (e.key === 'Escape') { setValue(initialName || 'Dashboard'); setEditing(false); }
  };

  return (
    <>
      <style>{`
        .cn-wrap { display: flex; align-items: center; gap: 0.5rem; }
        .cn-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300;
          color: #f5e6e8;
          line-height: 1;
          letter-spacing: -0.02em;
          cursor: pointer;
          border-bottom: 1px dashed transparent;
          transition: border-color 0.2s;
          padding-bottom: 2px;
        }
        .cn-title:hover { border-bottom-color: rgba(196,69,105,0.4); }
        .cn-edit-btn {
          background: none; border: none; cursor: pointer;
          color: rgba(196,69,105,0.4); font-size: 0.75rem;
          padding: 0.2rem 0.4rem; border-radius: 4px;
          transition: all 0.2s; opacity: 0;
        }
        .cn-wrap:hover .cn-edit-btn { opacity: 1; }
        .cn-edit-btn:hover { color: #c44569; background: rgba(196,69,105,0.08); }
        .cn-input {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 300;
          color: #f5e6e8;
          line-height: 1;
          letter-spacing: -0.02em;
          background: transparent;
          border: none;
          border-bottom: 1px solid rgba(196,69,105,0.5);
          outline: none;
          padding-bottom: 2px;
          width: auto;
          min-width: 200px;
          max-width: 100%;
        }
        .cn-hint {
          font-size: 0.65rem;
          color: rgba(245,230,232,0.25);
          margin-top: 0.2rem;
          font-family: 'Jost', sans-serif;
        }
      `}</style>

      {editing ? (
        <div>
          <input
            ref={inputRef}
            className="cn-input"
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            onBlur={save}
            maxLength={50}
            disabled={saving}
          />
          <div className="cn-hint">Enter pentru salvare · Esc pentru anulare</div>
        </div>
      ) : (
        <div className="cn-wrap">
          <span
            className="cn-title"
            onClick={() => setEditing(true)}
            title="Click pentru a edita"
          >
            {saving ? '...' : value}
          </span>
          <button className="cn-edit-btn" onClick={() => setEditing(true)} title="Editează numele">
            ✏️
          </button>
        </div>
      )}
    </>
  );
}
