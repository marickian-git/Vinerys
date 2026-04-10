'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function ConsumeButton({ wineId, currentQuantity }) {
  const router = useRouter();
  const [consuming, setConsuming] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const handleConsume = async () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }

    setConsuming(true);
    try {
      const res = await fetch(`/api/wines/${wineId}/consume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 1 }),
      });
      if (res.ok) {
        toast.success('O sticlă consumată 🍷');
        router.refresh();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Eroare la consum');
        setConfirm(false);
      }
    } catch {
      toast.error('Eroare de rețea');
      setConfirm(false);
    } finally {
      setConsuming(false);
    }
  };

  // Resetează confirmarea după 2 secunde sau la pierderea focusului
  const resetConfirm = () => {
    setTimeout(() => setConfirm(false), 2000);
  };

  if (currentQuantity === 0) return null;

  return (
    <>
      <style>{`
        .consume-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          font-family: 'Jost', sans-serif;
          font-size: 0.75rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s;
          border: none;
          flex: 1;
          justify-content: center;
          min-width: 100px;
          background: transparent;
          border: 1px solid rgba(85, 196, 78, 0.2);
          color: rgba(85, 196, 78, 0.6);
        }
        .consume-btn:hover {
          background: rgba(85, 196, 78, 0.08);
          border-color: rgba(85, 196, 78, 0.4);
          color: rgba(85, 196, 78, 0.9);
        }
        .consume-btn.confirm {
          border-color: rgba(85, 196, 78, 0.6);
          color: rgba(85, 196, 78, 0.9);
          background: rgba(85, 196, 78, 0.1);
        }
        .consume-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none;
        }
      `}</style>

      <button
        className={`consume-btn ${confirm ? 'confirm' : ''}`}
        onClick={handleConsume}
        disabled={consuming}
        onBlur={() => setConfirm(false)}
        onMouseLeave={() => setTimeout(() => setConfirm(false), 300)}
      >
        {consuming ? '⏳' : confirm ? '🍷 Confirmi?' : '🍷 Consumă o sticlă'}
      </button>
    </>
  );
}