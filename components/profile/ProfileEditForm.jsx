'use client';

import { useState } from 'react';
import { updateProfile } from '@/utils/actions';
import ImageUpload from '@/components/wines/ImageUpload';
import toast from 'react-hot-toast';

export default function ProfileEditForm({ profile }) {
  const [name, setName]   = useState(profile.name || '');
  const [image, setImage] = useState(profile.image || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.append('name', name);
    if (image) fd.append('image', image);

    try {
      const result = await updateProfile(fd);
      if (result?.error) {
        Object.values(result.error).flat().forEach(msg => toast.error(msg));
      } else {
        toast.success('Profil actualizat!');
      }
    } catch (err) {
      if (!err.message?.includes('NEXT_REDIRECT')) toast.error('Eroare la salvare');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Jost:wght@300;400;500&display=swap');
        .pef-wrap { font-family: 'Jost', sans-serif; }
        .pef-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .pef-full { grid-column: 1 / -1; }
        .pef-label { display: block; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245,230,232,0.45); margin-bottom: 0.5rem; font-weight: 400; }
        .pef-input {
          width: 100%; padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(196,69,105,0.15);
          border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.85rem;
          font-weight: 300; outline: none; transition: all 0.25s;
        }
        .pef-input:focus { border-color: rgba(196,69,105,0.5); background: rgba(196,69,105,0.04); box-shadow: 0 0 0 3px rgba(196,69,105,0.07); }
        .pef-input[disabled] { opacity: 0.4; cursor: not-allowed; }
        .pef-input::placeholder { color: rgba(245,230,232,0.2); }
        .pef-hint { font-size: 0.65rem; color: rgba(245,230,232,0.2); margin-top: 0.35rem; letter-spacing: 0.05em; }
        .pef-btn {
          margin-top: 1.5rem;
          padding: 0.75rem 1.75rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none; border-radius: 8px;
          color: #f5e6e8; font-family: 'Jost', sans-serif;
          font-size: 0.78rem; font-weight: 500;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.25s;
          box-shadow: 0 2px 10px rgba(196,69,105,0.2);
        }
        .pef-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(196,69,105,0.35); }
        .pef-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .pef-spinner { width: 12px; height: 12px; border: 2px solid rgba(245,230,232,0.3); border-top-color: #f5e6e8; border-radius: 50%; animation: pefspin 0.6s linear infinite; display: inline-block; margin-right: 6px; vertical-align: middle; }
        @keyframes pefspin { to { transform: rotate(360deg); } }
        @media (max-width: 600px) { .pef-grid { grid-template-columns: 1fr; } .pef-full { grid-column: 1; } }
      `}</style>

      <form className="pef-wrap" onSubmit={handleSubmit}>
        <div className="pef-grid">
          <div>
            <label className="pef-label">Nume afișat</label>
            <input
              className="pef-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Numele tău"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="pef-label">Email</label>
            <input className="pef-input" value={profile.email} disabled />
            <p className="pef-hint">Emailul nu poate fi schimbat</p>
          </div>

          <div className="pef-full">
            <ImageUpload
              label="Fotografie de profil"
              value={image}
              onChange={(url) => setImage(url || '')}
              folder="avatars"
            />
          </div>
        </div>

        <button type="submit" className="pef-btn" disabled={loading}>
          {loading
            ? <><span className="pef-spinner" />Se salvează...</>
            : '💾 Salvează modificările'
          }
        </button>
      </form>
    </>
  );
}
