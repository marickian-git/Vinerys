import Link from 'next/link';

export const metadata = { title: 'Offline · Vinerys' };

export default function OfflinePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;1,300&family=Jost:wght@300;400&display=swap');
        .off-page {
          min-height: 100vh; background: #0d0608;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Jost', sans-serif; padding: 2rem;
          position: relative; overflow: hidden;
        }
        .off-glow {
          position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
          width: 500px; height: 300px;
          background: radial-gradient(ellipse, rgba(139,26,46,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .off-inner { position: relative; text-align: center; max-width: 480px; }
        .off-icon {
          font-size: 3rem; display: block; margin-bottom: 1.5rem;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        .off-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 300;
          color: #f5e6e8; margin-bottom: 0.75rem; line-height: 1.2;
        }
        .off-title em { font-style: italic; color: rgba(196,69,105,0.8); }
        .off-divider {
          width: 60px; height: 1px; margin: 0 auto 1.5rem;
          background: linear-gradient(to right, transparent, rgba(196,69,105,0.35), transparent);
        }
        .off-sub {
          font-size: 0.85rem; color: rgba(245,230,232,0.28);
          font-weight: 300; line-height: 1.75; margin-bottom: 2.5rem;
        }
        .off-btn {
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.75rem 1.5rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8; text-decoration: none; border-radius: 10px;
          font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em;
          text-transform: uppercase; transition: all 0.25s;
          box-shadow: 0 4px 20px rgba(196,69,105,0.2);
        }
        .off-btn:hover { transform: translateY(-2px); box-shadow: 0 6px 28px rgba(196,69,105,0.35); }
        .off-quote {
          margin-top: 3rem; font-family: 'Cormorant Garamond', serif;
          font-size: 0.9rem; font-style: italic; color: rgba(245,230,232,0.1);
        }
      `}</style>

      <div className="off-page">
        <div className="off-glow" />
        <div className="off-inner">
          <span className="off-icon">📡</span>
          <h1 className="off-title">
            Pivnița este <em>deconectată</em>
          </h1>
          <div className="off-divider" />
          <p className="off-sub">
            Nu există conexiune la internet în acest moment.<br />
            Verifică rețeaua și încearcă din nou.
          </p>
          <Link href="/dashboard" className="off-btn">
            ↺ Încearcă din nou
          </Link>
          <p className="off-quote">"Vinul bun nu are nevoie de rețea."</p>
        </div>
      </div>
    </>
  );
}