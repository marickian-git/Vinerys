import Link from 'next/link';

export const metadata = { title: '404 — Pagina nu există · Vinerys' };

export default function NotFound() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Jost:wght@300;400;500&display=swap');

        .nf-page {
          min-height: 100vh; background: #0d0608;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Jost', sans-serif; padding: 2rem;
          position: relative; overflow: hidden;
        }
        .nf-glow {
          position: absolute; top: 15%; left: 50%; transform: translateX(-50%);
          width: 700px; height: 400px;
          background: radial-gradient(ellipse, rgba(139,26,46,0.1) 0%, transparent 70%);
          pointer-events: none;
        }
        .nf-inner { position: relative; text-align: center; max-width: 520px; }
        .nf-code {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(7rem, 20vw, 11rem); font-weight: 300;
          line-height: 1; letter-spacing: -0.04em;
          background: linear-gradient(135deg, rgba(139,26,46,0.35), rgba(196,69,105,0.2));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; margin-bottom: -0.5rem; user-select: none;
        }
        .nf-bottle {
          font-size: 2.5rem; display: block; margin-bottom: 1.5rem;
          animation: bob 3s ease-in-out infinite;
        }
        @keyframes bob {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50%       { transform: translateY(-10px) rotate(3deg); }
        }
        .nf-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 300;
          color: #f5e6e8; margin-bottom: 0.75rem; line-height: 1.25;
        }
        .nf-title em { font-style: italic; color: rgba(196,69,105,0.9); }
        .nf-divider {
          width: 60px; height: 1px; margin: 0 auto 1.5rem;
          background: linear-gradient(to right, transparent, rgba(196,69,105,0.4), transparent);
        }
        .nf-sub {
          font-size: 0.85rem; color: rgba(245,230,232,0.28);
          font-weight: 300; line-height: 1.75; margin-bottom: 2.5rem;
        }
        .nf-actions {
          display: flex; gap: 0.85rem; justify-content: center;
          flex-wrap: wrap; margin-bottom: 3rem;
        }
        .nf-btn-primary {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8; text-decoration: none; border-radius: 10px;
          font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(196,69,105,0.25);
        }
        .nf-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(196,69,105,0.4); }
        .nf-btn-ghost {
          display: inline-flex; align-items: center; gap: 0.45rem;
          padding: 0.75rem 1.5rem; background: transparent;
          border: 1px solid rgba(196,69,105,0.2); color: rgba(245,230,232,0.45);
          text-decoration: none; border-radius: 10px; font-size: 0.8rem;
          letter-spacing: 0.1em; text-transform: uppercase; transition: all 0.2s;
        }
        .nf-btn-ghost:hover {
          border-color: rgba(196,69,105,0.45); color: rgba(245,230,232,0.8);
          background: rgba(196,69,105,0.05);
        }
        .nf-quote {
          font-family: 'Cormorant Garamond', serif; font-size: 0.92rem;
          font-style: italic; color: rgba(245,230,232,0.12);
        }
      `}</style>

      <div className="nf-page">
        <div className="nf-glow" />
        <div className="nf-inner">
          <div className="nf-code">404</div>
          <span className="nf-bottle">🍷</span>
          <h1 className="nf-title">
            Această pagină a fost <em>consumată</em>
          </h1>
          <div className="nf-divider" />
          <p className="nf-sub">
            Pagina pe care o cauți nu există, a fost mutată<br />
            sau poate n-a existat niciodată în pivniță.
          </p>
          <div className="nf-actions">
            <Link href="/dashboard" className="nf-btn-primary">🏠 Dashboard</Link>
            <Link href="/wines" className="nf-btn-ghost">🍷 Colecția mea</Link>
          </div>
          <p className="nf-quote">"In vino veritas, in aqua sanitas."</p>
        </div>
      </div>
    </>
  );
}