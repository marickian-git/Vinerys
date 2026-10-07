import Link from 'next/link';
import { appPath } from '@/utils/appPath';

// Card simplu pentru paginile secundare de autentificare (resetare parolă etc.).
// Stilul urmează pagina de sign-in; se înlocuiește la restilizare (Faza 2).
export default function AuthCard({ title, subtitle, children, footer }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400&family=Jost:wght@300;400;500&display=swap');
        .ac-page { min-height: 100vh; display: grid; place-items: center; padding: 2rem 1rem; font-family: 'Jost', sans-serif;
          background: radial-gradient(ellipse at 30% 20%, rgba(120,20,40,.45) 0%, transparent 60%), #0d0608; }
        .ac-card { width: 100%; max-width: 420px; padding: 2.5rem 2rem; border: 1px solid rgba(196,69,105,.15); border-radius: 18px; background: rgba(26,8,16,.85); }
        .ac-logo { display: flex; justify-content: center; margin-bottom: 1.5rem; }
        .ac-logo img { width: 56px; height: 56px; object-fit: contain; }
        .ac-title { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 300; color: #f5e6e8; text-align: center; margin: 0 0 .5rem; }
        .ac-sub { font-size: .82rem; color: rgba(245,230,232,.45); text-align: center; line-height: 1.6; margin: 0 0 2rem; font-weight: 300; }
        .ac-label { display: block; font-size: .7rem; text-transform: uppercase; letter-spacing: .15em; color: rgba(245,230,232,.5); margin-bottom: .6rem; }
        .ac-input { width: 100%; box-sizing: border-box; padding: .9rem 1rem; margin-bottom: 1.25rem; background: rgba(255,255,255,.03);
          border: 1px solid rgba(196,69,105,.2); border-radius: 10px; color: #f5e6e8; font-family: inherit; font-size: .9rem; outline: none; }
        .ac-input:focus { border-color: rgba(196,69,105,.6); box-shadow: 0 0 0 3px rgba(196,69,105,.08); }
        .ac-btn { width: 100%; padding: .95rem; border: 0; border-radius: 10px; background: linear-gradient(135deg,#8b1a2e,#c44569); color: #f5e6e8;
          font-family: inherit; font-size: .8rem; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }
        .ac-btn:disabled { opacity: .6; cursor: not-allowed; }
        .ac-note { padding: 1rem; border-radius: 10px; background: rgba(85,196,78,.07); border: 1px solid rgba(85,196,78,.2); color: rgba(220,240,218,.85); font-size: .85rem; line-height: 1.6; }
        .ac-error { padding: 1rem; border-radius: 10px; background: rgba(220,80,80,.08); border: 1px solid rgba(220,80,80,.25); color: rgba(240,170,170,.9); font-size: .85rem; line-height: 1.6; }
        .ac-footer { margin-top: 1.75rem; text-align: center; font-size: .8rem; color: rgba(245,230,232,.35); }
        .ac-footer a { color: #c44569; text-decoration: none; }
      `}</style>
      <main className="ac-page">
        <div className="ac-card">
          <div className="ac-logo"><img src={appPath('/logo.png')} alt="Vinerys" /></div>
          <h1 className="ac-title">{title}</h1>
          {subtitle && <p className="ac-sub">{subtitle}</p>}
          {children}
          <div className="ac-footer">{footer ?? <Link href="/sign-in">← Înapoi la autentificare</Link>}</div>
        </div>
      </main>
    </>
  );
}
