'use client';

import Link from 'next/link';
import { useSession, signOut } from '@/utils/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    router.push('/sign-in');
  };

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const initial = session?.user?.name?.charAt(0).toUpperCase() ?? '?';
  const avatarSrc = session?.user?.image;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .vn-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 50;
          height: 64px; font-family: 'Jost', sans-serif;
          background: rgba(13, 6, 8, 0.85); backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196, 69, 105, 0.12);
          transition: background 0.3s ease;
        }
        .vn-nav-inner {
          max-width: 1200px; margin: 0 auto; padding: 0 1.5rem;
          height: 100%; display: flex; align-items: center; justify-content: space-between;
        }

        .vn-logo { display: flex; align-items: center; gap: 0.6rem; text-decoration: none; flex-shrink: 0; }
        .vn-logo-icon {
          width: 30px; height: 30px;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border-radius: 7px; display: flex; align-items: center; justify-content: center;
          font-size: 0.95rem; box-shadow: 0 2px 12px rgba(196,69,105,0.3);
        }
        .vn-logo-text {
          font-family: 'Cormorant Garamond', serif; font-size: 1.25rem; font-weight: 600;
          color: #f5e6e8; letter-spacing: 0.18em; text-transform: uppercase;
        }

        .vn-links { display: flex; align-items: center; gap: 0.25rem; }
        .vn-link {
          position: relative; padding: 0.4rem 0.85rem;
          font-size: 0.78rem; font-weight: 400; letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(245, 230, 232, 0.5); text-decoration: none; border-radius: 6px;
          transition: color 0.2s ease;
        }
        .vn-link::after {
          content: ''; position: absolute; bottom: -2px; left: 50%; right: 50%;
          height: 1px; background: #c44569; transition: left 0.3s ease, right 0.3s ease;
        }
        .vn-link:hover { color: rgba(245, 230, 232, 0.85); }
        .vn-link:hover::after { left: 0.85rem; right: 0.85rem; }
        .vn-link.active { color: #f5e6e8; }
        .vn-link.active::after { left: 0.85rem; right: 0.85rem; }

        .vn-divider { width: 1px; height: 18px; background: rgba(196, 69, 105, 0.2); margin: 0 0.75rem; }

        /* User dropdown */
        .vn-user { display: flex; align-items: center; position: relative; }
        .vn-avatar-btn {
          display: flex; align-items: center; gap: 0.6rem;
          background: none; border: none; cursor: pointer;
          padding: 0.3rem 0.5rem; border-radius: 8px; transition: background 0.2s;
        }
        .vn-avatar-btn:hover { background: rgba(196,69,105,0.08); }

        .vn-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(139,26,46,0.6), rgba(196,69,105,0.4));
          border: 1px solid rgba(196,69,105,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem; color: #f5e6e8; font-weight: 500;
          flex-shrink: 0; overflow: hidden;
        }
        .vn-avatar img { width: 100%; height: 100%; object-fit: cover; }

        .vn-username {
          font-size: 0.78rem; color: rgba(245, 230, 232, 0.45); font-weight: 300;
          letter-spacing: 0.05em; max-width: 100px;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .vn-chevron { font-size: 0.55rem; color: rgba(196,69,105,0.6); transition: transform 0.2s; margin-left: 2px; }
        .vn-chevron.open { transform: rotate(180deg); }

        .vn-dropdown {
          position: absolute; top: calc(100% + 10px); right: 0;
          min-width: 200px;
          background: rgba(18, 8, 12, 0.98);
          border: 1px solid rgba(196,69,105,0.15); border-radius: 12px;
          padding: 0.5rem;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(196,69,105,0.08);
          backdrop-filter: blur(20px);
          opacity: 0; transform: translateY(-6px) scale(0.97);
          pointer-events: none; transition: all 0.2s ease; z-index: 100;
        }
        .vn-dropdown.open { opacity: 1; transform: translateY(0) scale(1); pointer-events: all; }

        .vn-dropdown-header {
          padding: 0.65rem 0.75rem 0.55rem;
          border-bottom: 1px solid rgba(196,69,105,0.1); margin-bottom: 0.35rem;
        }
        .vn-dropdown-name { font-size: 0.82rem; color: #f5e6e8; font-weight: 400; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .vn-dropdown-email { font-size: 0.68rem; color: rgba(245,230,232,0.25); font-weight: 300; margin-top: 0.1rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .vn-dropdown-item {
          display: flex; align-items: center; gap: 0.6rem;
          padding: 0.55rem 0.75rem; font-size: 0.75rem; letter-spacing: 0.06em;
          color: rgba(245,230,232,0.55); text-decoration: none; border-radius: 7px;
          transition: all 0.15s; cursor: pointer;
          background: none; border: none; width: 100%;
          font-family: 'Jost', sans-serif; text-align: left;
        }
        .vn-dropdown-item:hover { background: rgba(196,69,105,0.08); color: rgba(245,230,232,0.85); }
        .vn-dropdown-item.danger { color: rgba(220,80,80,0.6); }
        .vn-dropdown-item.danger:hover { background: rgba(220,80,80,0.08); color: rgba(220,80,80,0.9); }

        .vn-dropdown-divider { height: 1px; background: rgba(196,69,105,0.1); margin: 0.35rem 0; }
        .vn-dropdown-icon { font-size: 0.85rem; width: 16px; text-align: center; flex-shrink: 0; }

        /* Auth */
        .vn-btn-ghost {
          padding: 0.38rem 0.9rem; font-family: 'Jost', sans-serif;
          font-size: 0.72rem; font-weight: 400; letter-spacing: 0.12em; text-transform: uppercase;
          color: rgba(245, 230, 232, 0.5); background: transparent;
          border: 1px solid transparent; border-radius: 6px;
          text-decoration: none; transition: all 0.25s ease;
        }
        .vn-btn-ghost:hover { color: #f5e6e8; border-color: rgba(196, 69, 105, 0.2); }
        .vn-btn-primary {
          padding: 0.38rem 1rem; font-family: 'Jost', sans-serif;
          font-size: 0.72rem; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase;
          color: #f5e6e8; background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none; border-radius: 6px; text-decoration: none;
          transition: all 0.25s ease; box-shadow: 0 2px 10px rgba(196,69,105,0.25);
        }
        .vn-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(196,69,105,0.4); }

        /* Hamburger */
        .vn-hamburger { display: none; flex-direction: column; gap: 5px; cursor: pointer; padding: 4px; background: none; border: none; }
        .vn-hamburger span { display: block; width: 22px; height: 1.5px; background: rgba(245,230,232,0.6); border-radius: 2px; transition: all 0.3s ease; transform-origin: center; }
        .vn-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .vn-hamburger.open span:nth-child(2) { opacity: 0; }
        .vn-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

        /* Mobile menu */
        .vn-mobile-menu {
          position: fixed; top: 64px; left: 0; right: 0;
          background: rgba(13,6,8,0.97); backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196,69,105,0.12);
          padding: 1.5rem; display: flex; flex-direction: column;
          gap: 0.5rem; z-index: 49;
          transform: translateY(-10px); opacity: 0;
          pointer-events: none; transition: all 0.25s ease;
        }
        .vn-mobile-menu.open { transform: translateY(0); opacity: 1; pointer-events: all; }

        .vn-mobile-link {
          padding: 0.75rem 1rem; font-size: 0.82rem; font-weight: 400;
          letter-spacing: 0.1em; text-transform: uppercase;
          color: rgba(245,230,232,0.55); text-decoration: none;
          border-radius: 8px; transition: all 0.2s; border: 1px solid transparent;
        }
        .vn-mobile-link:hover, .vn-mobile-link.active {
          color: #f5e6e8; background: rgba(196,69,105,0.08); border-color: rgba(196,69,105,0.15);
        }
        .vn-mobile-divider { height: 1px; background: rgba(196,69,105,0.12); margin: 0.5rem 0; }

        .vn-mobile-user { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem; }
        .vn-mobile-username { font-size: 0.82rem; color: rgba(245,230,232,0.4); font-weight: 300; }

        .vn-mobile-signout {
          text-align: left; cursor: pointer; background: none;
          border: 1px solid transparent; width: 100%;
          color: rgba(196,69,105,0.8); font-family: 'Jost', sans-serif;
          letter-spacing: 0.1em; text-transform: uppercase;
          border-radius: 8px; padding: 0.75rem 1rem; font-size: 0.82rem;
          transition: all 0.2s;
        }
        .vn-mobile-signout:hover { background: rgba(196,69,105,0.08); border-color: rgba(196,69,105,0.15); }

        @media (max-width: 768px) {
          .vn-links, .vn-divider, .vn-auth { display: none !important; }
          .vn-hamburger { display: flex; }
        }
      `}</style>

      <nav className="vn-nav">
        <div className="vn-nav-inner">
          <Link href="/" className="vn-logo">
            <div className="vn-logo-icon">🍷</div>
            <span className="vn-logo-text">Vinerys</span>
          </Link>

          {session ? (
            <div className="vn-links">
              <Link href="/wines" className={`vn-link ${isActive('/wines') ? 'active' : ''}`}>Vinurile mele</Link>
              <Link href="/dashboard" className={`vn-link ${isActive('/dashboard') ? 'active' : ''}`}>Dashboard</Link>
              <div className="vn-divider" />
              <div className="vn-user" ref={dropdownRef}>
                <button className="vn-avatar-btn" onClick={() => setDropdownOpen(o => !o)}>
                  <div className="vn-avatar">
                    {avatarSrc ? <img src={avatarSrc} alt={session.user.name} /> : initial}
                  </div>
                  <span className="vn-username">{session.user.name}</span>
                  <span className={`vn-chevron ${dropdownOpen ? 'open' : ''}`}>▼</span>
                </button>

                <div className={`vn-dropdown ${dropdownOpen ? 'open' : ''}`}>
                  <div className="vn-dropdown-header">
                    <div className="vn-dropdown-name">{session.user.name}</div>
                    <div className="vn-dropdown-email">{session.user.email}</div>
                  </div>
                  <Link href="/profile" className="vn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <span className="vn-dropdown-icon">👤</span> Profilul meu
                  </Link>
                  <Link href="/settings" className="vn-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <span className="vn-dropdown-icon">⚙️</span> Setări cont
                  </Link>
                  <div className="vn-dropdown-divider" />
                  <button className="vn-dropdown-item danger" onClick={handleSignOut}>
                    <span className="vn-dropdown-icon">←</span> Deconectare
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="vn-links vn-auth">
              <Link href="/sign-in" className="vn-btn-ghost">Autentificare</Link>
              <Link href="/sign-up" className="vn-btn-primary">Înregistrare</Link>
            </div>
          )}

          <button className={`vn-hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(!menuOpen)} aria-label="Meniu">
            <span /><span /><span />
          </button>
        </div>
      </nav>

      <div className={`vn-mobile-menu ${menuOpen ? 'open' : ''}`}>
        {session ? (
          <>
            <div className="vn-mobile-user">
              <div className="vn-avatar">
                {avatarSrc
                  ? <img src={avatarSrc} alt={session.user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : initial
                }
              </div>
              <span className="vn-mobile-username">{session.user.name}</span>
            </div>
            <div className="vn-mobile-divider" />
            <Link href="/wines" className={`vn-mobile-link ${isActive('/wines') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>🍷 Vinurile mele</Link>
            <Link href="/dashboard" className={`vn-mobile-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>📊 Dashboard</Link>
            <div className="vn-mobile-divider" />
            <Link href="/profile" className={`vn-mobile-link ${isActive('/profile') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>👤 Profilul meu</Link>
            <Link href="/settings" className={`vn-mobile-link ${isActive('/settings') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>⚙️ Setări cont</Link>
            <div className="vn-mobile-divider" />
            <button className="vn-mobile-signout" onClick={() => { setMenuOpen(false); handleSignOut(); }}>← Deconectare</button>
          </>
        ) : (
          <>
            <Link href="/sign-in" className="vn-mobile-link" onClick={() => setMenuOpen(false)}>Autentificare</Link>
            <Link href="/sign-up" className="vn-mobile-link active" onClick={() => setMenuOpen(false)}>Înregistrare</Link>
          </>
        )}
      </div>
    </>
  );
}
