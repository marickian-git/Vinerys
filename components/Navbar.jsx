'use client';

import Link from 'next/link';
import { useSession, signOut } from '@/utils/auth-client';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/sign-in');
  };

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .vn-nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 50;
          height: 64px;
          font-family: 'Jost', sans-serif;
          background: rgba(13, 6, 8, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196, 69, 105, 0.12);
          transition: background 0.3s ease;
        }

        .vn-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* Logo */
        .vn-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
          flex-shrink: 0;
        }
        .vn-logo-icon {
          width: 30px; height: 30px;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.95rem;
          box-shadow: 0 2px 12px rgba(196,69,105,0.3);
        }
        .vn-logo-text {
          font-family: 'Cormorant Garamond', serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: #f5e6e8;
          letter-spacing: 0.18em;
          text-transform: uppercase;
        }

        /* Nav links */
        .vn-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .vn-link {
          position: relative;
          padding: 0.4rem 0.85rem;
          font-size: 0.78rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245, 230, 232, 0.5);
          text-decoration: none;
          border-radius: 6px;
          transition: color 0.2s ease;
        }
        .vn-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 50%; right: 50%;
          height: 1px;
          background: #c44569;
          transition: left 0.3s ease, right 0.3s ease;
        }
        .vn-link:hover { color: rgba(245, 230, 232, 0.85); }
        .vn-link:hover::after { left: 0.85rem; right: 0.85rem; }
        .vn-link.active { color: #f5e6e8; }
        .vn-link.active::after { left: 0.85rem; right: 0.85rem; background: #c44569; }

        /* Divider */
        .vn-divider {
          width: 1px; height: 18px;
          background: rgba(196, 69, 105, 0.2);
          margin: 0 0.75rem;
        }

        /* User area */
        .vn-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .vn-avatar {
          width: 30px; height: 30px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(139,26,46,0.6), rgba(196,69,105,0.4));
          border: 1px solid rgba(196,69,105,0.35);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.75rem;
          color: #f5e6e8;
          font-weight: 500;
          letter-spacing: 0.05em;
          flex-shrink: 0;
        }

        .vn-username {
          font-size: 0.78rem;
          color: rgba(245, 230, 232, 0.45);
          font-weight: 300;
          letter-spacing: 0.05em;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .vn-btn-signout {
          padding: 0.38rem 0.9rem;
          font-family: 'Jost', sans-serif;
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(196, 69, 105, 0.8);
          background: transparent;
          border: 1px solid rgba(196, 69, 105, 0.25);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .vn-btn-signout:hover {
          color: #f5e6e8;
          background: rgba(196, 69, 105, 0.15);
          border-color: rgba(196, 69, 105, 0.5);
        }

        /* Auth buttons */
        .vn-btn-ghost {
          padding: 0.38rem 0.9rem;
          font-family: 'Jost', sans-serif;
          font-size: 0.72rem;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(245, 230, 232, 0.5);
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.25s ease;
        }
        .vn-btn-ghost:hover {
          color: #f5e6e8;
          border-color: rgba(196, 69, 105, 0.2);
        }

        .vn-btn-primary {
          padding: 0.38rem 1rem;
          font-family: 'Jost', sans-serif;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #f5e6e8;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          border: none;
          border-radius: 6px;
          text-decoration: none;
          transition: all 0.25s ease;
          box-shadow: 0 2px 10px rgba(196,69,105,0.25);
        }
        .vn-btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(196,69,105,0.4);
        }

        /* Mobile hamburger */
        .vn-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          cursor: pointer;
          padding: 4px;
          background: none;
          border: none;
        }
        .vn-hamburger span {
          display: block;
          width: 22px; height: 1.5px;
          background: rgba(245, 230, 232, 0.6);
          border-radius: 2px;
          transition: all 0.3s ease;
          transform-origin: center;
        }
        .vn-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
        .vn-hamburger.open span:nth-child(2) { opacity: 0; }
        .vn-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

        /* Mobile menu */
        .vn-mobile-menu {
          position: fixed;
          top: 64px; left: 0; right: 0;
          background: rgba(13, 6, 8, 0.97);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(196, 69, 105, 0.12);
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          z-index: 49;
          transform: translateY(-10px);
          opacity: 0;
          pointer-events: none;
          transition: all 0.25s ease;
        }
        .vn-mobile-menu.open {
          transform: translateY(0);
          opacity: 1;
          pointer-events: all;
        }

        .vn-mobile-link {
          padding: 0.75rem 1rem;
          font-size: 0.82rem;
          font-weight: 400;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(245, 230, 232, 0.55);
          text-decoration: none;
          border-radius: 8px;
          transition: all 0.2s;
          border: 1px solid transparent;
        }
        .vn-mobile-link:hover, .vn-mobile-link.active {
          color: #f5e6e8;
          background: rgba(196, 69, 105, 0.08);
          border-color: rgba(196, 69, 105, 0.15);
        }

        .vn-mobile-divider {
          height: 1px;
          background: rgba(196, 69, 105, 0.12);
          margin: 0.5rem 0;
        }

        .vn-mobile-user {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
        }
        .vn-mobile-username {
          font-size: 0.82rem;
          color: rgba(245, 230, 232, 0.4);
          font-weight: 300;
        }

        @media (max-width: 768px) {
          .vn-links, .vn-user, .vn-divider, .vn-auth { display: none !important; }
          .vn-hamburger { display: flex; }
        }
      `}</style>

      <nav className="vn-nav">
        <div className="vn-nav-inner">
          {/* Logo */}
          <Link href="/" className="vn-logo">
            <div className="vn-logo-icon">🍷</div>
            <span className="vn-logo-text">Vinerys</span>
          </Link>

          {/* Desktop nav */}
          {session ? (
            <div className="vn-links">
              <Link href="/wines" className={`vn-link ${isActive('/wines') ? 'active' : ''}`}>
                Vinurile mele
              </Link>
              <Link href="/dashboard" className={`vn-link ${isActive('/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <div className="vn-divider" />
              <div className="vn-user">
                <div className="vn-avatar">
                  {session.user.name?.charAt(0).toUpperCase() ?? '?'}
                </div>
                <span className="vn-username">{session.user.name}</span>
                <button className="vn-btn-signout" onClick={handleSignOut}>
                  Ieșire
                </button>
              </div>
            </div>
          ) : (
            <div className="vn-links vn-auth">
              <Link href="/sign-in" className="vn-btn-ghost">Autentificare</Link>
              <Link href="/sign-up" className="vn-btn-primary">Înregistrare</Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className={`vn-hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Meniu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div className={`vn-mobile-menu ${menuOpen ? 'open' : ''}`}>
        {session ? (
          <>
            <div className="vn-mobile-user">
              <div className="vn-avatar">
                {session.user.name?.charAt(0).toUpperCase() ?? '?'}
              </div>
              <span className="vn-mobile-username">{session.user.name}</span>
            </div>
            <div className="vn-mobile-divider" />
            <Link href="/wines" className={`vn-mobile-link ${isActive('/wines') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Vinurile mele
            </Link>
            <Link href="/dashboard" className={`vn-mobile-link ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            <div className="vn-mobile-divider" />
            <button
              className="vn-mobile-link"
              style={{ textAlign: 'left', cursor: 'pointer', background: 'none', border: '1px solid transparent', width: '100%', color: 'rgba(196,69,105,0.8)', fontFamily: 'Jost, sans-serif', letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: '8px', padding: '0.75rem 1rem' }}
              onClick={() => { setMenuOpen(false); handleSignOut(); }}
            >
              Ieșire
            </button>
          </>
        ) : (
          <>
            <Link href="/sign-in" className="vn-mobile-link" onClick={() => setMenuOpen(false)}>
              Autentificare
            </Link>
            <Link href="/sign-up" className="vn-mobile-link active" onClick={() => setMenuOpen(false)}>
              Înregistrare
            </Link>
          </>
        )}
      </div>
    </>
  );
}
