import { getWineById } from '@/utils/actions';
import WineForm from '@/components/wines/WineForm';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export const metadata = { title: 'Editează vin — Vinerys' };

export default async function EditWinePage({ params }) {
  const { id } = await params;

  let wine;
  try {
    wine = await getWineById(id);
  } catch {
    notFound();
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,600&family=Jost:wght@300;400;500&display=swap');
        .edit-page { min-height: 100vh; background: #0d0608; padding: 6rem 1.5rem 4rem; font-family: 'Jost', sans-serif; }
        .edit-inner { max-width: 760px; margin: 0 auto; }
        .edit-back { display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(245,230,232,0.3); text-decoration: none; margin-bottom: 2rem; transition: color 0.2s; }
        .edit-back:hover { color: rgba(245,230,232,0.65); }
        .edit-eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: #c44569; margin-bottom: 0.4rem; }
        .edit-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(1.8rem, 3vw, 2.5rem); font-weight: 300; color: #f5e6e8; line-height: 1.1; letter-spacing: -0.02em; }
        .edit-sub { font-size: 0.82rem; color: rgba(245,230,232,0.35); font-weight: 300; margin-top: 0.5rem; }
        .edit-divider { height: 1px; background: linear-gradient(to right, rgba(196,69,105,0.3), transparent); margin: 1.5rem 0 2rem; }
        .edit-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(196,69,105,0.1); border-radius: 16px; padding: 2rem; }
        @media (max-width: 640px) { .edit-page { padding: 5rem 1rem 3rem; } .edit-card { padding: 1.25rem; } }
      `}</style>

      <div className="edit-page">
        <div className="edit-inner">
          <Link href={`/wines/${wine.id}`} className="edit-back">← Înapoi la detalii</Link>
          <p className="edit-eyebrow">Editare colecție</p>
          <h1 className="edit-title">{wine.name}</h1>
          <p className="edit-sub">Modifică detaliile vinului din pivnița ta</p>
          <div className="edit-divider" />
          <div className="edit-card">
            <WineForm wine={wine} />
          </div>
        </div>
      </div>
    </>
  );
}
