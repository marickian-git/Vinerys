'use client';

import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function ScanLabelButton({ onScan }) {
  const [scanning, setScanning] = useState(false);
  const [preview, setPreview]   = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Selectează o imagine'); return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Imaginea e prea mare (max 10MB)'); return;
    }

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);

    setScanning(true);
    const toastId = toast.loading('🔍 Analizez eticheta...');

    try {
      // Convertește la base64
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
      toast.success('✨ Etichetă analizată! Verifică și corectează câmpurile.');
      onScan(result.data);
      setPreview(null);

    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Eroare la analizarea etichetei');
      setPreview(null);
    } finally {
      setScanning(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <style>{`
        .scan-wrap { margin-bottom: 1.5rem; }
        .scan-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.65rem 1.25rem;
          background: rgba(212,175,55,0.08);
          border: 1px solid rgba(212,175,55,0.25);
          border-radius: 10px; color: #d4af37;
          font-family: 'Jost', sans-serif; font-size: 0.78rem;
          font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; width: 100%;
          justify-content: center;
        }
        .scan-btn:hover:not(:disabled) {
          background: rgba(212,175,55,0.14);
          border-color: rgba(212,175,55,0.4);
          transform: translateY(-1px);
        }
        .scan-btn:disabled { opacity: 0.6; cursor: wait; }

        .scan-hint {
          font-size: 0.68rem; color: rgba(245,230,232,0.25);
          text-align: center; margin-top: 0.5rem; line-height: 1.5;
        }

        .scan-preview {
          margin-top: 0.75rem;
          border-radius: 10px; overflow: hidden;
          border: 1px solid rgba(212,175,55,0.2);
          position: relative; max-height: 180px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.3);
        }
        .scan-preview img {
          max-height: 180px; max-width: 100%;
          object-fit: contain;
        }
        .scan-overlay {
          position: absolute; inset: 0;
          background: rgba(13,6,8,0.7);
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 0.5rem;
        }
        .scan-spinner {
          width: 28px; height: 28px;
          border: 2px solid rgba(212,175,55,0.2);
          border-top-color: #d4af37;
          border-radius: 50%;
          animation: scanspin 0.8s linear infinite;
        }
        @keyframes scanspin { to { transform: rotate(360deg); } }
        .scan-overlay-text {
          font-size: 0.72rem; color: #d4af37;
          font-family: 'Jost', sans-serif; letter-spacing: 0.1em;
        }
      `}</style>

      <div className="scan-wrap">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files?.[0])}
        />

        <button
          type="button"
          className="scan-btn"
          onClick={() => inputRef.current?.click()}
          disabled={scanning}
        >
          {scanning ? (
            <><span className="scan-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Analizez...</>
          ) : (
            <>📸 Scanează eticheta cu AI</>
          )}
        </button>

        <p className="scan-hint">
          Fotografiază eticheta și AI-ul completează câmpurile automat
        </p>

        {preview && (
          <div className="scan-preview">
            <img src={preview} alt="Previzualizare etichetă" />
            {scanning && (
              <div className="scan-overlay">
                <div className="scan-spinner" />
                <span className="scan-overlay-text">Analizez...</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
