import Link from 'next/link';
import { getWrapped } from '@/utils/actions';
import { monthName, wrappedShareText } from '@/utils/wrapped';
import WrappedShare from '@/components/WrappedShare';

export const metadata = { title: 'Vinerys Wrapped' };

// Fiecare „slide” e un card mare, ca într-o poveste; pe telefon se derulează vertical
const card = (accent) => ({
  minHeight: 320, borderRadius: 24, padding: '2rem 1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '1rem',
  background: accent, color: '#fff8f0',
});
const big = { fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: 'clamp(3.5rem, 12vw, 5.5rem)', lineHeight: 1, margin: 0, fontWeight: 600 };
const label = { fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.18em', opacity: 0.85, margin: 0 };
const euro = (value) => `${Math.round(value).toLocaleString('ro-RO')} €`;

export default async function WrappedPage({ searchParams }) {
  const sp = await searchParams;
  const year = Number.parseInt(sp.year, 10) || new Date().getFullYear();
  const w = await getWrapped(year);
  const maxMonth = Math.max(1, ...w.months);

  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '5.5rem 1rem 4rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 560, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <nav aria-label="An" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
          <Link href={`/wrapped?year=${year - 1}`} style={{ color: '#d97a95' }}>← {year - 1}</Link>
          <span style={{ letterSpacing: '0.2em', textTransform: 'uppercase', fontSize: '0.75rem' }}>Vinerys Wrapped</span>
          {year < new Date().getFullYear() ? <Link href={`/wrapped?year=${year + 1}`} style={{ color: '#d97a95' }}>{year + 1} →</Link> : <span />}
        </nav>

        <section style={card('#6d1530')}>
          <p style={label}>Anul tău în vin · {year}</p>
          <p style={big}>{w.bottles}</p>
          <p style={{ margin: 0, fontSize: '1.1rem' }}>
            {w.bottles === 1 ? 'sticlă deschisă' : 'sticle deschise'}
            {w.wines > 0 && `, din ${w.wines} ${w.wines === 1 ? 'vin' : 'vinuri'} diferite`}
          </p>
        </section>

        {w.bottles === 0 ? (
          <section style={card('#2a1b22')}>
            <p style={{ margin: 0, fontSize: '1.05rem' }}>Încă nu ai consumat nicio sticlă în {year}. Când deschizi una, apasă „Consumă o sticlă” și o vei regăsi aici.</p>
            <Link href="/wines" style={{ color: '#ffd7b0' }}>Mergi la pivniță →</Link>
          </section>
        ) : (
          <>
            <section style={card('#1f4d4a')}>
              <p style={label}>Ai călătorit prin</p>
              <p style={big}>{w.countries.count} {w.countries.count === 1 ? 'țară' : 'țări'}</p>
              <ol style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '1rem' }}>
                {w.countries.top.map((c) => <li key={c.name}>{c.name} · {c.count} {c.count === 1 ? 'sticlă' : 'sticle'}</li>)}
              </ol>
            </section>

            {w.varieties.top[0] && (
              <section style={card('#7a4a12')}>
                <p style={label}>Soiul anului</p>
                <p style={{ ...big, fontSize: 'clamp(2.4rem, 9vw, 3.6rem)' }}>{w.varieties.top[0].name}</p>
                <p style={{ margin: 0 }}>{w.varieties.count} {w.varieties.count === 1 ? 'soi' : 'soiuri'} în total{w.varieties.top.length > 1 && `, urmat de ${w.varieties.top.slice(1).map((v) => v.name).join(' și ')}`}.</p>
              </section>
            )}

            <section style={card('#33244d')}>
              <p style={label}>Ritmul anului</p>
              <div aria-hidden="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', gap: 6, alignItems: 'end', height: 120 }}>
                {w.months.map((count, month) => (
                  <div key={month} title={`${monthName(month)}: ${count}`} style={{ height: `${Math.max(4, (count / maxMonth) * 100)}%`, background: month === w.busiestMonth ? '#ffb27a' : 'rgba(255,248,240,0.35)', borderRadius: 4 }} />
                ))}
              </div>
              <p style={{ margin: 0 }}>Cea mai activă lună: <strong>{monthName(w.busiestMonth)}</strong> ({w.months[w.busiestMonth]} {w.months[w.busiestMonth] === 1 ? 'sticlă' : 'sticle'}).</p>
            </section>

            {(w.topProducer || w.mostExpensive) && (
              <section style={card('#4a1f14')}>
                {w.topProducer && (<div><p style={label}>Producătorul preferat</p><p style={{ fontSize: '1.6rem', margin: '0.3rem 0 0' }}>{w.topProducer.name}</p></div>)}
                {w.mostExpensive && (<div><p style={label}>Cea mai scumpă sticlă deschisă</p><p style={{ fontSize: '1.3rem', margin: '0.3rem 0 0' }}>{w.mostExpensive.name} · {euro(w.mostExpensive.price)}</p></div>)}
                {w.favorites.length > 0 && (<div><p style={label}>Preferatele tale</p><p style={{ margin: '0.3rem 0 0' }}>{w.favorites.map((f) => f.name).join(' · ')}</p></div>)}
              </section>
            )}
          </>
        )}

        <section style={card('#14262e')}>
          <p style={label}>Pivnița azi</p>
          <p style={{ ...big, fontSize: 'clamp(2.6rem, 10vw, 4rem)' }}>{w.collection.bottles} sticle</p>
          <p style={{ margin: 0 }}>Valoare estimată: {euro(w.collection.value)}</p>
        </section>

        {w.bottles > 0 && <WrappedShare text={wrappedShareText(w)} />}
      </div>
    </main>
  );
}
