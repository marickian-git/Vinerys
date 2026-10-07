'use client';

import { useState, useTransition } from 'react';
import toast from 'react-hot-toast';
import { setCollectionSharing, regenerateShareLink } from '@/utils/actions';

export default function ShareLinkSection({ initialUrl, initialEnabled }) {
  const [copied, setCopied] = useState(false);
  const [enabled, setEnabled] = useState(Boolean(initialEnabled));
  const [shareUrl, setShareUrl] = useState(initialUrl);
  const [confirmRegen, setConfirmRegen] = useState(false);
  const [pending, startTransition] = useTransition();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link copiat!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nu s-a putut copia');
    }
  };

  const toggle = () => startTransition(async () => {
    try {
      const res = await setCollectionSharing(!enabled);
      setEnabled(res.enabled);
      setShareUrl(res.shareUrl);
      toast.success(res.enabled ? 'Colecția este publică' : 'Colecția este privată');
    } catch {
      toast.error('Nu s-a putut actualiza partajarea');
    }
  });

  const regenerate = () => {
    if (!confirmRegen) {
      setConfirmRegen(true);
      setTimeout(() => setConfirmRegen(false), 3000);
      return;
    }
    setConfirmRegen(false);
    startTransition(async () => {
      try {
        const res = await regenerateShareLink();
        setShareUrl(res.shareUrl);
        toast.success('Link nou generat. Cel vechi nu mai funcționează.');
      } catch {
        toast.error('Nu s-a putut genera linkul');
      }
    });
  };

  return (
    <>
      <style>{`
        .share-wrap { display: flex; gap: 0.6rem; align-items: stretch; }
        .share-input {
          flex: 1; padding: 0.72rem 1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(196,69,105,0.12);
          border-radius: 8px; color: rgba(245,230,232,0.5);
          font-family: 'Jost', sans-serif; font-size: 0.78rem;
          font-weight: 300; outline: none;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          cursor: default;
        }
        .share-copy-btn {
          padding: 0.72rem 1.1rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none; border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.75rem;
          font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
          box-shadow: 0 2px 10px rgba(196,69,105,0.2);
        }
        .share-copy-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(196,69,105,0.35); }
        .share-open-btn {
          padding: 0.72rem 0.9rem;
          background: transparent;
          border: 1px solid rgba(196,69,105,0.2);
          border-radius: 8px; color: rgba(245,230,232,0.45);
          font-family: 'Jost', sans-serif; font-size: 0.78rem;
          cursor: pointer; transition: all 0.2s; white-space: nowrap;
          text-decoration: none; display: flex; align-items: center;
        }
        .share-open-btn:hover { border-color: rgba(196,69,105,0.4); color: rgba(245,230,232,0.8); }
        .share-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: 0.9rem; }
        .share-toggle-label { font-size: 0.8rem; color: rgba(245,230,232,0.6); font-weight: 300; }
        .share-switch {
          position: relative; width: 44px; height: 24px; flex-shrink: 0;
          border-radius: 999px; border: 1px solid rgba(196,69,105,0.3);
          background: rgba(255,255,255,0.05); cursor: pointer; transition: background 0.2s;
        }
        .share-switch.on { background: linear-gradient(135deg, #8b1a2e, #c44569); border-color: transparent; }
        .share-switch::after {
          content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px;
          border-radius: 50%; background: #f5e6e8; transition: transform 0.2s;
        }
        .share-switch.on::after { transform: translateX(20px); }
        .share-switch:disabled { opacity: 0.5; cursor: wait; }
        .share-regen-btn {
          margin-top: 0.75rem; padding: 0.5rem 0.9rem; background: transparent;
          border: 1px solid rgba(196,69,105,0.2); border-radius: 8px;
          color: rgba(245,230,232,0.45); font-family: 'Jost', sans-serif; font-size: 0.72rem;
          cursor: pointer; transition: all 0.2s;
        }
        .share-regen-btn:hover, .share-regen-btn.confirm { border-color: rgba(196,69,105,0.5); color: rgba(245,230,232,0.85); }
        .share-hint { font-size: 0.68rem; color: rgba(245,230,232,0.25); margin-top: 0.6rem; font-weight: 300; line-height: 1.6; }
      `}</style>

      <div className="share-toggle-row">
        <span className="share-toggle-label">
          {enabled ? 'Colecția este publică' : 'Colecția este privată'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Colecție publică"
          className={`share-switch ${enabled ? 'on' : ''}`}
          onClick={toggle}
          disabled={pending}
        />
      </div>

      {enabled && shareUrl ? (
        <>
          <div className="share-wrap">
            <input
              readOnly
              className="share-input"
              value={shareUrl}
              onClick={copy}
              title={shareUrl}
            />
            <button className="share-copy-btn" onClick={copy}>
              {copied ? '✓ Copiat' : '⎘ Copiază'}
            </button>
            <a href={shareUrl} target="_blank" rel="noopener noreferrer" className="share-open-btn" title="Deschide">
              ↗
            </a>
          </div>
          <button
            type="button"
            className={`share-regen-btn ${confirmRegen ? 'confirm' : ''}`}
            onClick={regenerate}
            disabled={pending}
          >
            {confirmRegen ? 'Sigur? Linkul vechi nu va mai funcționa' : '↻ Generează link nou'}
          </button>
          <p className="share-hint">
            Oricine cu acest link poate vedea vinurile din pivniță (fără prețuri sau locații).
          </p>
        </>
      ) : (
        <p className="share-hint">
          Activează pentru a primi un link public către colecția ta. Prețurile și locațiile rămân private.
        </p>
      )}
    </>
  );
}
