'use client';

import Link from 'next/link';
import { useState } from 'react';
import { deleteWine, toggleFavorite } from '@/utils/actions';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function WineActions({ wineId, isFavorite }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [toggling, setToggling] = useState(false);

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); return; }
    setDeleting(true);
    try {
      await deleteWine(wineId);
      toast.success('Vin șters din colecție');
    } catch (e) {
      if (!e.message?.includes('NEXT_REDIRECT')) {
        toast.error('Eroare la ștergere');
        setDeleting(false);
        setConfirm(false);
      }
    }
  };

  const handleFavorite = async () => {
    setToggling(true);
    try {
      await toggleFavorite(wineId);
      toast.success(isFavorite ? 'Eliminat din favorite' : 'Adăugat la favorite ❤️');
      router.refresh();
    } catch {
      toast.error('Eroare');
    } finally {
      setToggling(false);
    }
  };

  return (
    <>
      <style>{`
        .wa-wrap { display: flex; gap: 0.6rem; flex-wrap: wrap; width: 100%; }

        .wa-btn {
          display: flex; align-items: center; gap: 0.4rem;
          padding: 0.6rem 1rem;
          border-radius: 8px;
          font-family: 'Jost', sans-serif;
          font-size: 0.75rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s;
          text-decoration: none;
          border: none;
          flex: 1;
          justify-content: center;
          min-width: 100px;
        }

        .wa-btn-edit {
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8;
          box-shadow: 0 2px 10px rgba(196,69,105,0.2);
        }
        .wa-btn-edit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(196,69,105,0.35); }

        .wa-btn-fav {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.2) !important;
          color: rgba(245,230,232,0.6);
        }
        .wa-btn-fav:hover { background: rgba(196,69,105,0.1); border-color: rgba(196,69,105,0.4) !important; color: #f5e6e8; }
        .wa-btn-fav.active { color: #c44569; border-color: rgba(196,69,105,0.5) !important; }

        .wa-btn-del {
          background: transparent;
          border: 1px solid rgba(220,80,80,0.2) !important;
          color: rgba(220,80,80,0.5);
        }
        .wa-btn-del:hover { background: rgba(220,80,80,0.08); border-color: rgba(220,80,80,0.4) !important; color: rgba(220,80,80,0.9); }
        .wa-btn-del.confirm { border-color: rgba(220,80,80,0.6) !important; color: rgba(220,80,80,0.9); background: rgba(220,80,80,0.1); }

        .wa-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }
      `}</style>

      <div className="wa-wrap">
        <Link href={`/wines/edit/${wineId}`} className="wa-btn wa-btn-edit">
          ✏️ Editează
        </Link>

        <button
          className={`wa-btn wa-btn-fav ${isFavorite ? 'active' : ''}`}
          onClick={handleFavorite}
          disabled={toggling}
        >
          {isFavorite ? '❤️ Favorit' : '🤍 Favorit'}
        </button>

        <button
          className={`wa-btn wa-btn-del ${confirm ? 'confirm' : ''}`}
          onClick={handleDelete}
          disabled={deleting}
          onBlur={() => setTimeout(() => setConfirm(false), 200)}
        >
          {deleting ? '⏳' : confirm ? '⚠️ Confirmi?' : '🗑️ Șterge'}
        </button>
      </div>
    </>
  );
}
