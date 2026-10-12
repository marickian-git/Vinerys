import Link from 'next/link';

// Layout comun pentru paginile legale (BIZ-004). Textul e o schiță: se revizuiește juridic înainte de lansarea publică.
export default function LegalPage({ title, updated, children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 4rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <article style={{ maxWidth: 720, margin: '0 auto', lineHeight: 1.7, fontSize: '0.95rem' }}>
        <Link href="/" style={{ color: '#d97a95', fontSize: '0.8rem', textDecoration: 'none' }}>← Vinerys</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 400, fontSize: '2.4rem', margin: '1rem 0 0.25rem' }}>{title}</h1>
        <p style={{ color: 'rgba(245,230,232,0.65)', fontSize: '0.8rem', marginTop: 0 }}>Ultima actualizare: {updated}</p>
        <div className="legal-body">{children}</div>
      </article>
    </div>
  );
}
