'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

export default function ShareLinkSection({ shareUrl }) {
  const [copied, setCopied] = useState(false);

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
        .share-hint { font-size: 0.68rem; color: rgba(245,230,232,0.25); margin-top: 0.6rem; font-weight: 300; line-height: 1.6; }
      `}</style>

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
      <p className="share-hint">
        Oricine cu acest link poate vedea colecția ta (fără prețuri sau locații). Linkul este permanent și unic.
      </p>
    </>
  );
}
