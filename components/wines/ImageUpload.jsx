'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_MB = 5;

function WineGridPattern() {
  const columns = 20;
  const rows = 6;
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: '10px',
      maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
      WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 75%)',
      opacity: 0.4,
    }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '8px' }}>
        {Array.from({ length: rows }).map((_, row) =>
          Array.from({ length: columns }).map((_, col) => {
            const index = row * columns + col;
            return (
              <div key={`${col}-${row}`} style={{
                width: '18px', height: '18px',
                borderRadius: '3px',
                flexShrink: 0,
                background: index % 3 === 0
                  ? 'rgba(139,26,46,0.3)'
                  : index % 3 === 1
                  ? 'rgba(196,69,105,0.15)'
                  : 'rgba(245,230,232,0.04)',
                boxShadow: index % 5 === 0
                  ? 'inset 0 0 0 1px rgba(196,69,105,0.2)'
                  : 'none',
              }} />
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ImageUpload({ label = 'Imagine', value, onChange, folder = 'wines' }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(value || null);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file) => {
    if (!ALLOWED.includes(file.type)) {
      toast.error('Tip nepermis. Acceptăm: JPG, PNG, WebP, GIF');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Fișierul e prea mare. Maximum ${MAX_MB}MB`);
      return;
    }

    setUploading(true);
    setProgress(0);

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + 12, 85));
    }, 150);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', folder);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();

      clearInterval(interval);

      if (!res.ok || !data.success) {
        toast.error(data.error || 'Eroare la upload');
        setPreview(value || null);
        return;
      }

      setProgress(100);
      setPreview(data.url);
      onChange?.(data.url);
      toast.success('Imagine încărcată!');
    } catch (err) {
      clearInterval(interval);
      toast.error('Eroare de rețea');
      setPreview(value || null);
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 800);
    }
  };

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles[0]) uploadFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif'] },
  });

  const handleRemove = (e) => {
    e.stopPropagation();
    setPreview(null);
    onChange?.(null);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,300&family=Jost:wght@300;400&display=swap');

        .iu-wrap { font-family: 'Jost', sans-serif; }
        .iu-label {
          display: block;
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: rgba(245,230,232,0.45);
          margin-bottom: 0.5rem;
          font-weight: 400;
        }

        .iu-dropzone {
          position: relative;
          border: 1px dashed rgba(196,69,105,0.2);
          border-radius: 10px;
          overflow: hidden;
          cursor: pointer;
          background: rgba(13,6,8,0.6);
          min-height: 160px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: border-color 0.25s, background 0.25s;
        }
        .iu-dropzone:hover {
          border-color: rgba(196,69,105,0.45);
          background: rgba(20,8,12,0.8);
        }
        .iu-dropzone.drag {
          border-color: #c44569;
          border-style: solid;
          background: rgba(196,69,105,0.06);
        }
        .iu-dropzone.has-image {
          border-style: solid;
          border-color: rgba(196,69,105,0.2);
          min-height: 180px;
        }

        /* Floating card animation */
        .iu-card-wrap {
          position: relative;
          width: 70px;
          height: 70px;
          margin: 0 auto 0.75rem;
        }
        .iu-card-back {
          position: absolute;
          top: -8px; left: 8px;
          width: 60px; height: 60px;
          border-radius: 8px;
          background: rgba(139,26,46,0.2);
          border: 1px solid rgba(196,69,105,0.2);
        }
        .iu-card-front {
          position: absolute;
          top: 0; left: 0;
          width: 60px; height: 60px;
          border-radius: 8px;
          background: rgba(26,8,16,0.9);
          border: 1px solid rgba(196,69,105,0.3);
          display: flex; align-items: center; justify-content: center;
          font-size: 1.4rem;
          box-shadow: 0 8px 24px rgba(0,0,0,0.4);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .iu-dropzone:hover .iu-card-front {
          transform: translate(6px, -6px);
          box-shadow: 0 14px 32px rgba(0,0,0,0.5);
        }
        .iu-dropzone.drag .iu-card-front {
          transform: translate(8px, -8px);
        }

        .iu-empty {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          padding: 1.75rem 1.5rem;
          text-align: center;
          pointer-events: none;
          width: 100%;
        }
        .iu-empty-title {
          font-size: 0.82rem;
          color: rgba(245,230,232,0.55);
          font-weight: 300;
          margin-top: 0.25rem;
        }
        .iu-empty-sub {
          font-size: 0.65rem;
          color: rgba(245,230,232,0.22);
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        .iu-drag-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1rem;
          font-style: italic;
          color: #c44569;
          font-weight: 300;
          margin-top: 0.5rem;
        }

        /* Preview */
        .iu-preview-img {
          width: 100%; height: 180px;
          object-fit: cover; display: block;
        }
        .iu-overlay {
          position: absolute; inset: 0;
          background: rgba(13,6,8,0.65);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.25s;
          z-index: 3;
        }
        .iu-dropzone.has-image:hover .iu-overlay { opacity: 1; }
        .iu-overlay-text {
          font-size: 0.72rem; color: #f5e6e8;
          text-transform: uppercase; letter-spacing: 0.12em;
          text-align: center; line-height: 1.8;
        }
        .iu-remove {
          position: absolute; top: 0.5rem; right: 0.5rem;
          width: 24px; height: 24px;
          background: rgba(220,80,80,0.85); border: none;
          border-radius: 50%; color: white; font-size: 0.65rem;
          cursor: pointer; display: flex; align-items: center; justify-content: center;
          z-index: 10; transition: background 0.2s;
        }
        .iu-remove:hover { background: rgb(220,80,80); }

        /* Progress */
        .iu-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 3px; background: rgba(255,255,255,0.05); z-index: 5; }
        .iu-progress-fill { height: 100%; background: linear-gradient(to right, #8b1a2e, #c44569); border-radius: 0 2px 2px 0; transition: width 0.2s ease; }

        /* Spinner */
        .iu-spinner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(13,6,8,0.55); z-index: 4; }
        .iu-spin { width: 26px; height: 26px; border: 2px solid rgba(196,69,105,0.25); border-top-color: #c44569; border-radius: 50%; animation: iuspin 0.7s linear infinite; }
        @keyframes iuspin { to { transform: rotate(360deg); } }

        .iu-hint { font-size: 0.62rem; color: rgba(245,230,232,0.18); margin-top: 0.4rem; letter-spacing: 0.06em; }
      `}</style>

      <div className="iu-wrap">
        <label className="iu-label">{label}</label>

        <motion.div
          {...getRootProps()}
          whileHover="animate"
          className={`iu-dropzone ${isDragActive ? 'drag' : ''} ${preview ? 'has-image' : ''}`}
        >
          <input {...getInputProps()} />

          {preview ? (
            <>
              <img src={preview} alt="Preview" className="iu-preview-img" />
              <div className="iu-overlay">
                <div className="iu-overlay-text">
                  🖼️ Schimbă imaginea<br />
                  <span style={{ fontSize: '0.62rem', opacity: 0.65 }}>click sau trage o imagine nouă</span>
                </div>
              </div>
              {!uploading && (
                <button className="iu-remove" onClick={handleRemove} title="Elimină">✕</button>
              )}
            </>
          ) : (
            <>
              {/* Dark grid background */}
              <WineGridPattern />

              <div className="iu-empty">
                {/* Floating card animation */}
                <div className="iu-card-wrap">
                  <div className="iu-card-back" />
                  <motion.div
                    className="iu-card-front"
                    variants={{
                      initial: { x: 0, y: 0 },
                      animate: { x: 6, y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } },
                    }}
                  >
                    🍷
                  </motion.div>
                </div>

                <AnimatePresence mode="wait">
                  {isDragActive ? (
                    <motion.p
                      key="drag"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="iu-drag-text"
                    >
                      Lasă imaginea aici...
                    </motion.p>
                  ) : (
                    <motion.div
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="iu-empty-title">Trage o imagine sau click</p>
                      <p className="iu-empty-sub">JPG · PNG · WebP · max {MAX_MB}MB</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {uploading && (
            <>
              <div className="iu-spinner"><div className="iu-spin" /></div>
              <div className="iu-progress">
                <div className="iu-progress-fill" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
        </motion.div>

        <p className="iu-hint">Imaginea va fi stocată privat în pivnița ta</p>
      </div>
    </>
  );
}
