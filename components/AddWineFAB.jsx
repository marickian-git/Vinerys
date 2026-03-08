'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function AddWineFAB() {
  const router = useRouter();
  const [open, setOpen]       = useState(false);
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  const handleImage = async (file) => {
    if (!file) return;
    setOpen(false);

    if (!file.type.startsWith('image/')) {
      toast.error('Selectează o imagine'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imaginea e prea mare (max 10MB)'); return;
    }

    setScanning(true);
    const toastId = toast.loading('📸 Analizez eticheta...');

    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });

      const response = await fetch('/api/ai-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Eroare la analiză');
      }

      toast.dismiss(toastId);
      toast.success('✨ Etichetă analizată! Verifică câmpurile.');

      // Serializează datele și navighează la /wines/add cu query params
      const params = new URLSearchParams();
      const data = result.data;
      Object.entries(data).forEach(([k, v]) => { if (v) params.set(k, v); });
      router.push(`/wines/add?${params.toString()}&fromScan=1`);

    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Eroare la analizarea etichetei');
    } finally {
      setScanning(false);
      if (cameraRef.current) cameraRef.current.value = '';
      if (galleryRef.current) galleryRef.current.value = '';
    }
  };

  return (
    <>
      <style>{`
        .fab-wrap {
          position: fixed; bottom: 1.5rem; right: 1.5rem;
          z-index: 200; font-family: 'Jost', sans-serif;
        }

        /* Backdrop */
        .fab-backdrop {
          position: fixed; inset: 0; z-index: 199;
          background: rgba(0,0,0,0.3); backdrop-filter: blur(2px);
          opacity: 0; pointer-events: none; transition: opacity 0.2s;
        }
        .fab-backdrop.open { opacity: 1; pointer-events: all; }

        /* Main FAB button */
        .fab-main {
          position: relative; z-index: 201;
          width: 56px; height: 56px; border-radius: 50%;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none; cursor: pointer; color: #f5e6e8;
          font-size: 1.4rem; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 4px 20px rgba(196,69,105,0.5), 0 2px 8px rgba(0,0,0,0.3);
          transition: all 0.25s; outline: none;
        }
        .fab-main:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(196,69,105,0.6); }
        .fab-main.open { transform: rotate(45deg); }
        .fab-main.scanning { animation: fab-pulse 1s ease-in-out infinite; }
        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(196,69,105,0.5); }
          50% { box-shadow: 0 4px 32px rgba(196,69,105,0.9); }
        }

        /* Speed dial options */
        .fab-options {
          position: absolute; bottom: 68px; right: 0;
          display: flex; flex-direction: column; gap: 0.6rem;
          align-items: flex-end;
          pointer-events: none;
        }

        .fab-option {
          display: flex; align-items: center; gap: 0.6rem;
          opacity: 0; transform: translateY(10px) scale(0.9);
          pointer-events: none; transition: all 0.2s;
        }
        .fab-option:nth-child(1) { transition-delay: 0.05s; }
        .fab-option:nth-child(2) { transition-delay: 0.1s; }
        .fab-option:nth-child(3) { transition-delay: 0.15s; }

        .fab-options.open .fab-option {
          opacity: 1; transform: translateY(0) scale(1);
          pointer-events: all;
        }

        .fab-option-label {
          background: rgba(18,8,12,0.95);
          border: 1px solid rgba(196,69,105,0.2);
          border-radius: 8px; padding: 0.4rem 0.85rem;
          font-size: 0.75rem; color: rgba(245,230,232,0.8);
          white-space: nowrap; letter-spacing: 0.05em;
          box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }

        .fab-option-btn {
          width: 44px; height: 44px; border-radius: 50%;
          border: none; cursor: pointer; color: #f5e6e8;
          font-size: 1.1rem; display: flex; align-items: center; justify-content: center;
          transition: all 0.2s; box-shadow: 0 2px 12px rgba(0,0,0,0.3);
        }
        .fab-option-btn.camera  { background: linear-gradient(135deg, #1a4a8b, #2d6cc4); }
        .fab-option-btn.gallery { background: linear-gradient(135deg, #1a6b3a, #2da856); }
        .fab-option-btn.manual  { background: linear-gradient(135deg, #4a3a1a, #8b6b2d); }
        .fab-option-btn:hover { transform: scale(1.1); }

        /* Scanning overlay */
        .fab-scanning-indicator {
          position: fixed; bottom: 5.5rem; right: 1.5rem;
          background: rgba(18,8,12,0.95); border: 1px solid rgba(196,69,105,0.3);
          border-radius: 12px; padding: 0.75rem 1rem;
          display: flex; align-items: center; gap: 0.6rem;
          font-size: 0.78rem; color: rgba(245,230,232,0.8);
          z-index: 201; box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          animation: fab-slide-in 0.2s ease;
        }
        @keyframes fab-slide-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fab-scan-spinner {
          width: 14px; height: 14px;
          border: 2px solid rgba(196,69,105,0.3);
          border-top-color: #c44569; border-radius: 50%;
          animation: fab-spin 0.7s linear infinite; flex-shrink: 0;
        }
        @keyframes fab-spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleImage(e.target.files?.[0])}
      />
      <input
        ref={galleryRef}
        type="file" accept="image/*"
        style={{ display: 'none' }}
        onChange={e => handleImage(e.target.files?.[0])}
      />

      {/* Backdrop */}
      <div className={`fab-backdrop ${open ? 'open' : ''}`} onClick={() => setOpen(false)} />

      {/* FAB */}
      <div className="fab-wrap">
        <div className={`fab-options ${open ? 'open' : ''}`}>
          {/* Camera */}
          <div className="fab-option">
            <span className="fab-option-label">Fotografiază eticheta</span>
            <button
              className="fab-option-btn camera"
              onClick={() => { setOpen(false); cameraRef.current?.click(); }}
              title="Deschide camera"
            >📸</button>
          </div>

          {/* Gallery */}
          <div className="fab-option">
            <span className="fab-option-label">Alege din galerie</span>
            <button
              className="fab-option-btn gallery"
              onClick={() => { setOpen(false); galleryRef.current?.click(); }}
              title="Alege din galerie"
            >🖼️</button>
          </div>

          {/* Manual */}
          <div className="fab-option">
            <span className="fab-option-label">Adaugă manual</span>
            <button
              className="fab-option-btn manual"
              onClick={() => { setOpen(false); router.push('/wines/add'); }}
              title="Adaugă manual"
            >✍️</button>
          </div>
        </div>

        <button
          className={`fab-main ${open ? 'open' : ''} ${scanning ? 'scanning' : ''}`}
          onClick={() => !scanning && setOpen(o => !o)}
          title="Adaugă vin"
          disabled={scanning}
        >
          {scanning ? (
            <span style={{ width: 22, height: 22, border: '2.5px solid rgba(245,230,232,0.3)', borderTopColor: '#f5e6e8', borderRadius: '50%', display: 'block', animation: 'fab-spin 0.7s linear infinite' }} />
          ) : '+'}
        </button>
      </div>

      {scanning && (
        <div className="fab-scanning-indicator">
          <div className="fab-scan-spinner" />
          Analizez eticheta...
        </div>
      )}
    </>
  );
}
