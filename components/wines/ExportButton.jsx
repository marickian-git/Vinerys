'use client';

import { useState, useRef, useEffect } from 'react';

const STATUS_OPTIONS = [
  { value: 'IN_CELLAR',  label: 'În pivniță' },
  { value: 'CONSUMED',   label: 'Consumate' },
  { value: 'SOLD',       label: 'Vândute' },
  { value: 'GIFTED',     label: 'Dăruite' },
];

export default function ExportButton() {
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(null); // 'csv-all' | 'pdf-all' etc
  const [showStatus, setShowStatus] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doExport = async (format, filter = 'all', status = '') => {
    const key = `${format}-${filter}${status}`;
    setLoading(key);
    setOpen(false);
    setShowStatus(false);

    const params = new URLSearchParams({ format, filter });
    if (status) params.set('status', status);

    const url = `/api/export?${params}`;

    if (format === 'pdf') {
      window.open(url, '_blank');
      setLoading(null);
      return;
    }

    // CSV — download direct
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vinerys-${filter}-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      console.error(e);
    }
    setLoading(null);
  };

  return (
    <>
      <style>{`
        .exp-wrap { position: relative; font-family: 'Jost', sans-serif; }
        .exp-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.7rem 1.1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(196,69,105,0.2);
          color: rgba(245,230,232,0.65);
          border-radius: 10px; font-size: 0.78rem;
          font-family: 'Jost', sans-serif;
          letter-spacing: 0.08em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
        }
        .exp-btn:hover { border-color: rgba(196,69,105,0.45); color: rgba(245,230,232,0.9); background: rgba(196,69,105,0.06); }
        .exp-btn.active { border-color: rgba(196,69,105,0.45); color: rgba(245,230,232,0.9); background: rgba(196,69,105,0.06); }
        .exp-chevron { font-size: 0.6rem; transition: transform 0.2s; }
        .exp-chevron.up { transform: rotate(180deg); }

        .exp-dropdown {
          position: absolute; top: calc(100% + 6px); right: 0;
          background: #140a0c;
          border: 1px solid rgba(196,69,105,0.15);
          border-radius: 12px; padding: 0.4rem;
          min-width: 220px; z-index: 100;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
          animation: expIn 0.15s ease;
        }
        @keyframes expIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }

        .exp-section { padding: 0.3rem 0.6rem 0.2rem; }
        .exp-section-label { font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(196,69,105,0.5); margin-bottom: 0.3rem; }

        .exp-item {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 0.6rem; border-radius: 8px;
          cursor: pointer; transition: background 0.15s;
          color: rgba(245,230,232,0.7); font-size: 0.78rem;
          border: none; background: none; width: 100%; text-align: left;
          font-family: 'Jost', sans-serif;
        }
        .exp-item:hover { background: rgba(196,69,105,0.08); color: rgba(245,230,232,0.95); }
        .exp-item:disabled { opacity: 0.4; cursor: wait; }
        .exp-item-icon { font-size: 0.9rem; width: 1.2rem; text-align: center; flex-shrink: 0; }
        .exp-item-sub { font-size: 0.65rem; color: rgba(245,230,232,0.3); display: block; margin-top: 1px; }

        .exp-divider { height: 1px; background: rgba(196,69,105,0.08); margin: 0.3rem 0; }

        .exp-status-list { padding: 0.2rem 0.4rem 0.3rem 1.8rem; display: flex; flex-direction: column; gap: 2px; }
        .exp-status-item {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.4rem 0.5rem; border-radius: 6px;
          cursor: pointer; transition: background 0.15s;
          color: rgba(245,230,232,0.6); font-size: 0.74rem;
          border: none; background: none; width: 100%; text-align: left;
          font-family: 'Jost', sans-serif;
        }
        .exp-status-item:hover { background: rgba(196,69,105,0.07); color: rgba(245,230,232,0.9); }
        .exp-spinner { width: 10px; height: 10px; border: 1.5px solid rgba(196,69,105,0.3); border-top-color: #c44569; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div className="exp-wrap" ref={ref}>
        <button
          className={`exp-btn ${open ? 'active' : ''}`}
          onClick={() => { setOpen(o => !o); setShowStatus(false); }}
        >
          ↓ Export
          <span className={`exp-chevron ${open ? 'up' : ''}`}>▼</span>
        </button>

        {open && (
          <div className="exp-dropdown">
            {/* CSV */}
            <div className="exp-section">
              <div className="exp-section-label">CSV — Excel / Sheets</div>
              <button className="exp-item" onClick={() => doExport('csv', 'all')} disabled={!!loading}>
                {loading === 'csv-all' ? <span className="exp-spinner"/> : <span className="exp-item-icon">📊</span>}
                <div><span>Toate vinurile</span></div>
              </button>
              <button className="exp-item" onClick={() => doExport('csv', 'favorites')} disabled={!!loading}>
                {loading === 'csv-favorites' ? <span className="exp-spinner"/> : <span className="exp-item-icon">❤️</span>}
                <div><span>Doar favorite</span></div>
              </button>
              <button
                className="exp-item"
                onClick={() => setShowStatus(s => !s)}
                disabled={!!loading}
              >
                <span className="exp-item-icon">🔍</span>
                <div><span>După status</span></div>
                <span style={{ marginLeft: 'auto', fontSize: '0.6rem', opacity: 0.4 }}>{showStatus ? '▲' : '▼'}</span>
              </button>
              {showStatus && (
                <div className="exp-status-list">
                  {STATUS_OPTIONS.map(s => (
                    <button key={s.value} className="exp-status-item" onClick={() => doExport('csv', 'status', s.value)} disabled={!!loading}>
                      {loading === `csv-status${s.value}` ? <span className="exp-spinner"/> : '›'}
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="exp-divider" />

            {/* PDF */}
            <div className="exp-section">
              <div className="exp-section-label">PDF — Raport vizual</div>
              <button className="exp-item" onClick={() => doExport('pdf', 'all')} disabled={!!loading}>
                {loading === 'pdf-all' ? <span className="exp-spinner"/> : <span className="exp-item-icon">📄</span>}
                <div>
                  <span>Catalog complet</span>
                  <span className="exp-item-sub">Se deschide pentru printare</span>
                </div>
              </button>
              <button className="exp-item" onClick={() => doExport('pdf', 'favorites')} disabled={!!loading}>
                {loading === 'pdf-favorites' ? <span className="exp-spinner"/> : <span className="exp-item-icon">❤️</span>}
                <div><span>Doar favorite</span></div>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
