'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from '@/utils/auth-client';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loadingPw, setLoadingPw]       = useState(false);
  const [loadingOut, setLoadingOut]     = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete]     = useState(false);
  const [pwStrength, setPwStrength]     = useState(0);

  const setField = (k, v) => {
    setPasswordForm(f => ({ ...f, [k]: v }));
    if (k === 'newPassword') {
      let s = 0;
      if (v.length >= 8) s++;
      if (/[A-Z]/.test(v)) s++;
      if (/[0-9]/.test(v)) s++;
      if (/[^A-Za-z0-9]/.test(v)) s++;
      setPwStrength(s);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Parolele nu coincid'); return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Parola trebuie să aibă minim 8 caractere'); return;
    }
    setLoadingPw(true);
    try {
      const fd = new FormData();
      Object.entries(passwordForm).forEach(([k, v]) => fd.append(k, v));
      const { updatePassword } = await import('@/utils/actions');
      const result = await updatePassword(fd);
      if (result?.error) { toast.error(result.error); }
      else { toast.success('Parolă schimbată cu succes!'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPwStrength(0); }
    } catch { toast.error('Eroare la schimbarea parolei'); }
    finally { setLoadingPw(false); }
  };

  const handleLogout = async () => {
    setLoadingOut(true);
    await signOut();
    router.push('/sign-in');
  };

  const strengthLabel = ['', 'Slabă', 'Medie', 'Bună', 'Excelentă'][pwStrength];
  const strengthColor = ['', '#dc5050', '#d4af37', '#7db87a', '#55c44e'][pwStrength];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600&family=Jost:wght@300;400;500&display=swap');

        .set-page { min-height: 100vh; background: #0d0608; padding: 6rem 1.5rem 4rem; font-family: 'Jost', sans-serif; }
        .set-inner { max-width: 680px; margin: 0 auto; }

        .set-back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(245,230,232,0.3); text-decoration: none; margin-bottom: 2rem; transition: color 0.2s; }
        .set-back:hover { color: rgba(245,230,232,0.65); }

        .set-header { margin-bottom: 2.5rem; }
        .set-eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: #c44569; margin-bottom: 0.4rem; }
        .set-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 300; color: #f5e6e8; line-height: 1.1; }

        .set-divider { height: 1px; background: linear-gradient(to right, rgba(196,69,105,0.3), transparent); margin-bottom: 2rem; }

        .set-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(196,69,105,0.08); border-radius: 16px; padding: 1.75rem; margin-bottom: 1.25rem; }
        .set-card-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.18em; color: #c44569; font-weight: 400; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(196,69,105,0.1); }

        .set-field { margin-bottom: 1rem; }
        .set-label { display: block; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245,230,232,0.45); margin-bottom: 0.5rem; font-weight: 400; }
        .set-input {
          width: 100%; padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(196,69,105,0.15);
          border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.85rem;
          font-weight: 300; outline: none; transition: all 0.25s;
        }
        .set-input:focus { border-color: rgba(196,69,105,0.5); background: rgba(196,69,105,0.04); box-shadow: 0 0 0 3px rgba(196,69,105,0.07); }
        .set-input::placeholder { color: rgba(245,230,232,0.2); }
        .set-input[type="password"] { letter-spacing: 0.15em; }

        /* Password strength */
        .set-strength { display: flex; gap: 4px; margin-top: 0.4rem; align-items: center; }
        .set-strength-bar { height: 3px; flex: 1; border-radius: 2px; background: rgba(255,255,255,0.06); transition: background 0.3s; }
        .set-strength-label { font-size: 0.65rem; color: rgba(245,230,232,0.3); margin-left: 0.4rem; transition: color 0.3s; white-space: nowrap; }

        .set-btn {
          padding: 0.72rem 1.5rem; background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none; border-radius: 8px; color: #f5e6e8;
          font-family: 'Jost', sans-serif; font-size: 0.78rem;
          font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.25s;
          box-shadow: 0 2px 10px rgba(196,69,105,0.2);
        }
        .set-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(196,69,105,0.35); }
        .set-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .set-btn-ghost {
          padding: 0.72rem 1.5rem;
          background: transparent; border: 1px solid rgba(196,69,105,0.2);
          border-radius: 8px; color: rgba(245,230,232,0.5);
          font-family: 'Jost', sans-serif; font-size: 0.78rem;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s;
          width: 100%;
        }
        .set-btn-ghost:hover { border-color: rgba(196,69,105,0.4); color: rgba(245,230,232,0.8); }

        /* Danger zone */
        .set-card-danger { border-color: rgba(220,80,80,0.15); }
        .set-card-danger .set-card-title { color: rgba(220,80,80,0.7); border-bottom-color: rgba(220,80,80,0.1); }

        .set-danger-text { font-size: 0.8rem; color: rgba(245,230,232,0.35); font-weight: 300; line-height: 1.7; margin-bottom: 1.25rem; }

        .set-delete-input-wrap { margin-bottom: 1rem; }
        .set-delete-hint { font-size: 0.72rem; color: rgba(245,230,232,0.3); margin-bottom: 0.5rem; }
        .set-delete-hint strong { color: rgba(220,80,80,0.7); font-weight: 500; }

        .set-btn-danger {
          padding: 0.72rem 1.5rem;
          background: transparent; border: 1px solid rgba(220,80,80,0.3);
          border-radius: 8px; color: rgba(220,80,80,0.6);
          font-family: 'Jost', sans-serif; font-size: 0.78rem;
          letter-spacing: 0.12em; text-transform: uppercase;
          cursor: pointer; transition: all 0.2s; width: 100%;
        }
        .set-btn-danger:hover:not(:disabled) { background: rgba(220,80,80,0.08); border-color: rgba(220,80,80,0.5); color: rgba(220,80,80,0.9); }
        .set-btn-danger:disabled { opacity: 0.35; cursor: not-allowed; }

        .set-spinner { width: 12px; height: 12px; border: 2px solid rgba(245,230,232,0.3); border-top-color: #f5e6e8; border-radius: 50%; animation: setspin 0.6s linear infinite; display: inline-block; margin-right: 6px; vertical-align: middle; }
        @keyframes setspin { to { transform: rotate(360deg); } }

        /* Info row */
        .set-info-row { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .set-info-row:last-child { border-bottom: none; }
        .set-info-label { font-size: 0.75rem; color: rgba(245,230,232,0.35); font-weight: 300; }
        .set-info-value { font-size: 0.82rem; color: rgba(245,230,232,0.65); }

        @media (max-width: 640px) { .set-page { padding: 5rem 1rem 3rem; } .set-card { padding: 1.25rem; } }
      `}</style>

      <div className="set-page">
        <div className="set-inner">
          <Link href="/profile" className="set-back">← Înapoi la profil</Link>

          <div className="set-header">
            <p className="set-eyebrow">Cont</p>
            <h1 className="set-title">Setări</h1>
          </div>
          <div className="set-divider" />

          {/* Schimbare parolă */}
          <div className="set-card">
            <div className="set-card-title">🔐 Schimbă parola</div>
            <form onSubmit={handlePassword}>
              <div className="set-field">
                <label className="set-label">Parola curentă</label>
                <input
                  type="password" className="set-input"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={e => setField('currentPassword', e.target.value)}
                  required
                />
              </div>
              <div className="set-field">
                <label className="set-label">Parolă nouă</label>
                <input
                  type="password" className="set-input"
                  placeholder="••••••••"
                  value={passwordForm.newPassword}
                  onChange={e => setField('newPassword', e.target.value)}
                  required minLength={8}
                />
                {passwordForm.newPassword && (
                  <div className="set-strength">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="set-strength-bar" style={{ background: i <= pwStrength ? strengthColor : undefined }} />
                    ))}
                    <span className="set-strength-label" style={{ color: strengthColor || undefined }}>{strengthLabel}</span>
                  </div>
                )}
              </div>
              <div className="set-field" style={{ marginBottom: '1.25rem' }}>
                <label className="set-label">Confirmă parola nouă</label>
                <input
                  type="password" className="set-input"
                  placeholder="••••••••"
                  value={passwordForm.confirmPassword}
                  onChange={e => setField('confirmPassword', e.target.value)}
                  required minLength={8}
                />
                {passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword && (
                  <p style={{ fontSize: '0.68rem', color: 'rgba(220,80,80,0.8)', marginTop: '0.35rem' }}>Parolele nu coincid</p>
                )}
              </div>
              <button type="submit" className="set-btn" disabled={loadingPw}>
                {loadingPw ? <><span className="set-spinner" />Se schimbă...</> : '🔑 Schimbă parola'}
              </button>
            </form>
          </div>

          {/* Sesiune */}
          <div className="set-card">
            <div className="set-card-title">🚪 Sesiune</div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(245,230,232,0.35)', marginBottom: '1.25rem', fontWeight: 300, lineHeight: 1.7 }}>
              Deconectează-te de pe acest dispozitiv. Sesiunea ta va expira imediat.
            </p>
            <button className="set-btn-ghost" onClick={handleLogout} disabled={loadingOut}>
              {loadingOut ? <><span className="set-spinner" />Se deconectează...</> : '← Deconectare'}
            </button>
          </div>

          {/* Danger zone */}
          <div className="set-card set-card-danger">
            <div className="set-card-title">⚠️ Zonă periculoasă</div>
            <p className="set-danger-text">
              Ștergerea contului este permanentă și irevocabilă. Toate vinurile, imaginile și datele tale vor fi șterse definitiv.
            </p>
            {!showDelete ? (
              <button className="set-btn-danger" onClick={() => setShowDelete(true)}>
                🗑️ Șterge contul permanent
              </button>
            ) : (
              <>
                <div className="set-delete-input-wrap">
                  <p className="set-delete-hint">Scrie <strong>ȘTERGE CONTUL</strong> pentru a confirma:</p>
                  <input
                    type="text" className="set-input"
                    placeholder="ȘTERGE CONTUL"
                    value={deleteConfirm}
                    onChange={e => setDeleteConfirm(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="set-btn-ghost" style={{ flex: 1 }} onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}>
                    Anulează
                  </button>
                  <button
                    className="set-btn-danger"
                    style={{ flex: 1 }}
                    disabled={deleteConfirm !== 'ȘTERGE CONTUL'}
                    onClick={async () => {
                      const { deleteAccount } = await import('@/utils/actions');
                      await deleteAccount();
                    }}
                  >
                    Confirmă ștergerea
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
