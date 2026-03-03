'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Jost:wght@300;400;500&display=swap');

        .er-page {
          min-height: 100vh; background: #0d0608;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Jost', sans-serif; padding: 2rem;
          position: relative; overflow: hidden;
        }
        .er-glow {
          position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
          width: 600px; height: 350px;
          background: radial-gradient(ellipse, rgba(220,60,60,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .er-inner { position: relative; text-align: center; max-width: 520px; }
        .er-icon {
          font-size: 3rem; display: block; margin-bottom: 1.5rem;
          animation: shake 0.5s ease-in-out;
        }
        @keyframes shake {
          0%,100%{ transform: rotate(0); }
          20%    { transform: rotate(-8deg); }
          40%    { transform: rotate(8deg); }
          60%    { transform: rotate(-5deg); }
          80%    { transform: rotate(5deg); }
        }
        .er-eyebrow {
          font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.2em;
          color: rgba(220,80,80,0.5); margin-bottom: 0.6rem;
        }
        .er-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 300;
          color: #f5e6e8; margin-bottom: 0.75rem; line-height: 1.2;
        }
        .er-title em { font-style: italic; color: rgba(220,80,80,0.8); }
        .er-divider {
          width: 60px; height: 1px; margin: 0 auto 1.5rem;
          background: linear-gradient(to right, transparent, rgba(220,80,80,0.3), transparent);
        }
        .er-sub {
          font-size: 0.83rem; color: rgba(245,230,232,0.28);
          font-weight: 300; line-height: 1.75; margin-bottom: 1.25rem;
        }
        .er-message {
          font-size: 0.72rem; color: rgba(220,80,80,0.45);
          background: rgba(220,80,80,0.05); border: 1px solid rgba(220,80,80,0.12);
          border-radius: 8px; padding: 0.7rem 1rem;
          margin-bottom: 2.5rem; font-family: monospace;
          text-align: left; word-break: break-all; line-height: 1.5;
        }
        .er-actions {
          display: flex; gap: 0.85rem; justify-content: center; flex-wrap: wrap;
        }
        .er-btn-retry {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8; border: none; border-radius: 10px;
          font-family: 'Jost', sans-serif; font-size: 0.8rem;
          font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
          cursor: pointer; transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(196,69,105,0.25);
        }
        .er-btn-retry:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(196,69,105,0.4); }
        .er-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.75rem 1.5rem; background: transparent;
          border: 1px solid rgba(196,69,105,0.2); color: rgba(245,230,232,0.45);
          text-decoration: none; border-radius: 10px; font-size: 0.8rem;
          letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.2s;
        }
        .er-btn-ghost:hover {
          border-color: rgba(196,69,105,0.45); color: rgba(245,230,232,0.8);
          background: rgba(196,69,105,0.05);
        }
      `}</style>

      <div className="er-page">
        <div className="er-glow" />
        <div className="er-inner">
          <span className="er-icon">⚠️</span>
          <p className="er-eyebrow">Eroare neașteptată</p>
          <h1 className="er-title">Ceva s-a <em>stricat</em></h1>
          <div className="er-divider" />
          <p className="er-sub">
            A apărut o problemă tehnică. Poți încerca din nou<br />
            sau te poți întoarce la pagina principală.
          </p>
          {error?.message && (
            <div className="er-message">{error.message}</div>
          )}
          <div className="er-actions">
            <button className="er-btn-retry" onClick={reset}>
              ↺ Încearcă din nou
            </button>
            <Link href="/dashboard" className="er-btn-ghost">
              🏠 Dashboard
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}