import { getProfile, getDashboardStats } from '@/utils/actions';
import Link from 'next/link';
import ImageUpload from '@/components/wines/ImageUpload';
import ProfileEditForm from '@/components/profile/ProfileEditForm';

export const metadata = { title: 'Profilul meu — Vinerys' };

const ROLE_LABELS = { USER: 'Colecționar', ADMIN: 'Administrator' };

export default async function ProfilePage() {
  let profile = null;
  let stats = { totalBottles: 0, totalWines: 0, totalValue: 0 };

  try {
    [profile, stats] = await Promise.all([getProfile(), getDashboardStats()]);
  } catch {}

  if (!profile) return null;

  const joinDate = new Date(profile.createdAt).toLocaleDateString('ro-RO', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const initial = profile.name?.charAt(0).toUpperCase() || '?';

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .prof-page { min-height: 100vh; background: #0d0608; padding: 6rem 1.5rem 4rem; font-family: 'Jost', sans-serif; }
        .prof-inner { max-width: 900px; margin: 0 auto; }

        .prof-back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(245,230,232,0.3); text-decoration: none; margin-bottom: 2rem; transition: color 0.2s; }
        .prof-back:hover { color: rgba(245,230,232,0.65); }

        /* Hero card */
        .prof-hero {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(196,69,105,0.1);
          border-radius: 20px;
          padding: 2.5rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 2rem;
          position: relative;
          overflow: hidden;
        }
        .prof-hero-glow {
          position: absolute; top: -40px; right: -40px;
          width: 200px; height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139,26,46,0.15), transparent 70%);
          pointer-events: none;
        }

        /* Avatar */
        .prof-avatar-wrap { position: relative; flex-shrink: 0; }
        .prof-avatar {
          width: 90px; height: 90px;
          border-radius: 50%;
          border: 2px solid rgba(196,69,105,0.3);
          overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          position: relative;
        }
        .prof-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .prof-avatar-initial {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 300;
          color: rgba(245,230,232,0.9);
          line-height: 1;
        }
        .prof-role-badge {
          position: absolute; bottom: -4px; right: -4px;
          padding: 0.15rem 0.5rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border-radius: 20px;
          font-size: 0.55rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245,230,232,0.9);
          white-space: nowrap;
          border: 1px solid rgba(13,6,8,0.5);
        }

        .prof-info { flex: 1; min-width: 0; }
        .prof-name {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem);
          font-weight: 300;
          color: #f5e6e8;
          line-height: 1.1;
          margin-bottom: 0.25rem;
        }
        .prof-email { font-size: 0.82rem; color: rgba(245,230,232,0.35); font-weight: 300; margin-bottom: 0.75rem; }
        .prof-join { font-size: 0.7rem; color: rgba(245,230,232,0.2); text-transform: uppercase; letter-spacing: 0.12em; }

        .prof-actions { display: flex; gap: 0.65rem; flex-shrink: 0; flex-wrap: wrap; }
        .prof-btn-edit {
          padding: 0.6rem 1.1rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8; text-decoration: none;
          border-radius: 8px; font-size: 0.75rem;
          font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; transition: all 0.25s;
          box-shadow: 0 2px 10px rgba(196,69,105,0.2);
          white-space: nowrap;
        }
        .prof-btn-edit:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(196,69,105,0.35); }
        .prof-btn-settings {
          padding: 0.6rem 1.1rem;
          background: transparent;
          border: 1px solid rgba(196,69,105,0.2);
          color: rgba(245,230,232,0.5); text-decoration: none;
          border-radius: 8px; font-size: 0.75rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          transition: all 0.2s; white-space: nowrap;
        }
        .prof-btn-settings:hover { border-color: rgba(196,69,105,0.4); color: rgba(245,230,232,0.8); }

        /* Stats */
        .prof-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1px;
          background: rgba(196,69,105,0.08);
          border-radius: 16px;
          overflow: hidden;
          border: 1px solid rgba(196,69,105,0.08);
          margin-bottom: 1.5rem;
        }
        .prof-stat {
          background: rgba(13,6,8,0.95);
          padding: 1.5rem;
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }
        .prof-stat:hover { background: rgba(255,255,255,0.02); }
        .prof-stat-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2rem; font-weight: 600;
          color: #f5e6e8; line-height: 1;
          margin-bottom: 0.35rem;
        }
        .prof-stat-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245,230,232,0.3); }

        /* Edit form card */
        .prof-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(196,69,105,0.08);
          border-radius: 16px;
          padding: 1.75rem;
          margin-bottom: 1.5rem;
        }
        .prof-card-title {
          font-size: 0.68rem; text-transform: uppercase;
          letter-spacing: 0.18em; color: #c44569;
          font-weight: 400; margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(196,69,105,0.1);
        }

        @media (max-width: 640px) {
          .prof-page { padding: 5rem 1rem 3rem; }
          .prof-hero { flex-direction: column; align-items: flex-start; gap: 1.25rem; padding: 1.5rem; }
          .prof-stats { grid-template-columns: 1fr 1fr; }
          .prof-actions { width: 100%; }
          .prof-btn-edit, .prof-btn-settings { flex: 1; text-align: center; }
        }
      `}</style>

      <div className="prof-page">
        <div className="prof-inner">
          <Link href="/dashboard" className="prof-back">← Dashboard</Link>

          {/* Hero */}
          <div className="prof-hero">
            <div className="prof-hero-glow" />
            <div className="prof-avatar-wrap">
              <div className="prof-avatar">
                {profile.image
                  ? <img src={profile.image} alt={profile.name} />
                  : <span className="prof-avatar-initial">{initial}</span>
                }
              </div>
              <div className="prof-role-badge">{ROLE_LABELS[profile.role] ?? profile.role}</div>
            </div>

            <div className="prof-info">
              <h1 className="prof-name">{profile.name}</h1>
              <p className="prof-email">{profile.email}</p>
              <p className="prof-join">Membru din {joinDate}</p>
            </div>

            <div className="prof-actions">
              <Link href="/settings" className="prof-btn-edit">⚙️ Setări</Link>
              <Link href="/wines" className="prof-btn-settings">🍷 Colecție</Link>
            </div>
          </div>

          {/* Stats */}
          <div className="prof-stats">
            <div className="prof-stat">
              <div className="prof-stat-value">{profile._count.wines}</div>
              <div className="prof-stat-label">Vinuri în colecție</div>
            </div>
            <div className="prof-stat">
              <div className="prof-stat-value">{stats.totalBottles}</div>
              <div className="prof-stat-label">Sticle totale</div>
            </div>
            <div className="prof-stat">
              <div className="prof-stat-value">{stats.totalValue > 0 ? `${Math.round(stats.totalValue)}€` : '—'}</div>
              <div className="prof-stat-label">Valoare colecție</div>
            </div>
          </div>

          {/* Edit profile form */}
          <div className="prof-card">
            <div className="prof-card-title">Editează profilul</div>
            <ProfileEditForm profile={profile} />
          </div>
        </div>
      </div>
    </>
  );
}
