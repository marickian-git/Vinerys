import Link from 'next/link';
import WineForm from '@/components/wines/WineForm';

export const metadata = {
  title: 'Adaugă vin — Vinerys',
};

export default function AddWinePage() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .add-page {
          min-height: 100vh;
          background: #0d0608;
          padding: 6rem 1.5rem 4rem;
          font-family: 'Jost', sans-serif;
        }

        .add-inner {
          max-width: 760px;
          margin: 0 auto;
        }

        .add-back {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(245,230,232,0.35);
          text-decoration: none;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }
        .add-back:hover { color: rgba(245,230,232,0.7); }

        .add-header { margin-bottom: 2.5rem; }
        .add-eyebrow {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.2em;
          color: #c44569;
          font-weight: 400;
          margin-bottom: 0.4rem;
        }
        .add-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 300;
          color: #f5e6e8;
          line-height: 1.1;
          letter-spacing: -0.02em;
        }
        .add-subtitle {
          font-size: 0.82rem;
          color: rgba(245,230,232,0.35);
          font-weight: 300;
          margin-top: 0.5rem;
          letter-spacing: 0.04em;
        }

        .add-divider {
          height: 1px;
          background: linear-gradient(to right, rgba(196,69,105,0.3), transparent);
          margin-bottom: 2rem;
        }

        .add-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(196,69,105,0.1);
          border-radius: 16px;
          padding: 2rem;
        }

        @media (max-width: 640px) {
          .add-page { padding: 5rem 1rem 3rem; }
          .add-card { padding: 1.25rem; border-radius: 12px; }
        }
      `}</style>

      <div className="add-page">
        <div className="add-inner">
          <Link href="/wines" className="add-back">
            ← Înapoi la colecție
          </Link>

          <div className="add-header">
            <p className="add-eyebrow">Colecție nouă</p>
            <h1 className="add-title">Adaugă un vin</h1>
            <p className="add-subtitle">Completează detaliile pentru a adăuga vinul în pivnița ta digitală</p>
          </div>

          <div className="add-divider" />

          <div className="add-card">
            <WineForm />
          </div>
        </div>
      </div>
    </>
  );
}
