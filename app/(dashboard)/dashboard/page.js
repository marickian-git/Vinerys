import Link from 'next/link';
import { getDashboardStats, getWines, getAdvancedStats, getProfile } from '@/utils/actions';
import WineCard from '@/components/wines/WineCard';
import CellarNameEditor from '@/components/CellarNameEditor';

export async function generateMetadata() {
  try {
    const profile = await getProfile();
    const name = profile?.cellarName || 'Dashboard';
    return { title: name + ' — Vinerys' };
  } catch {
    return { title: 'Dashboard — Vinerys' };
  }
}

const TYPE_LABELS  = { RED: 'Roșu', WHITE: 'Alb', ROSE: 'Roze', SPARKLING: 'Spumant', DESSERT: 'Desert', FORTIFIED: 'Fortifiat' };
const TYPE_COLORS  = { RED: '#8b1a2e', WHITE: '#d4af37', ROSE: '#c44569', SPARKLING: '#b4c8dc', DESSERT: '#b47828', FORTIFIED: '#643078' };
const STATUS_LABELS = { IN_CELLAR: 'În pivniță', CONSUMED: 'Consumat', SOLD: 'Vândut', GIFTED: 'Dăruit' };
const STATUS_COLORS = { IN_CELLAR: '#55c44e', CONSUMED: 'rgba(245,230,232,0.3)', SOLD: '#d4af37', GIFTED: '#c44569' };
const STAR_LABELS = { 5: 'Excepțional', 4: 'Excelent', 3: 'Bun', 2: 'Decent', 1: 'Slab' };

function Stars({ rating }) {
  return (
    <span style={{ color: '#d4af37', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

export default async function DashboardPage() {
  let stats = { totalBottles: 0, totalValue: 0, totalWines: 0, byType: {}, byStatus: {} };
  let recentWines = [];
  let advanced = {
    topWines: [], byCountry: {}, monthlyData: [],
    priceStats: { avg: 0, max: 0, min: 0, mostExpensive: null },
    nearMaturity: [],
  };

  let cellarName = 'Dashboard';
  try {
    const [s, winesResult, adv, profile] = await Promise.all([
      getDashboardStats(),
      getWines({ sort: 'newest', pageSize: '4', page: '1' }),
      getAdvancedStats(),
      getProfile(),
    ]);
    stats = s;
    recentWines = winesResult.wines ?? [];
    advanced = adv;
    cellarName = profile?.cellarName || 'Dashboard';
  } catch {}

  const topType  = Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0];
  const inCellar = stats.byStatus?.IN_CELLAR ?? 0;
  const maxMonthly = Math.max(...advanced.monthlyData.map(m => m.count), 1);
  const topCountries = Object.entries(advanced.byCountry).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const totalCountryWines = topCountries.reduce((a, [, v]) => a + v, 0) || 1;
  const currentYear = new Date().getFullYear();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .db-page { min-height: 100vh; background: #0d0608; padding: 6rem 1.5rem 4rem; font-family: 'Jost', sans-serif; }
        .db-inner { max-width: 1200px; margin: 0 auto; }

        .db-header { margin-bottom: 2.5rem; }
        .db-eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: #c44569; margin-bottom: 0.4rem; }
        .db-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; color: #f5e6e8; line-height: 1; letter-spacing: -0.02em; }
        .db-sub { font-size: 0.82rem; color: rgba(245,230,232,0.35); font-weight: 300; margin-top: 0.4rem; }
        .db-divider { height: 1px; background: linear-gradient(to right, rgba(196,69,105,0.3), transparent); margin-bottom: 2.5rem; }

        .db-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: rgba(196,69,105,0.08); border-radius: 16px; overflow: hidden; margin-bottom: 2rem; border: 1px solid rgba(196,69,105,0.08); }
        .db-kpi { background: rgba(13,6,8,0.95); padding: 1.75rem 1.5rem; position: relative; overflow: hidden; transition: background 0.3s; }
        .db-kpi:hover { background: rgba(255,255,255,0.02); }
        .db-kpi-glow { position: absolute; bottom: -20px; right: -20px; width: 80px; height: 80px; border-radius: 50%; background: radial-gradient(circle, rgba(196,69,105,0.15), transparent); pointer-events: none; }
        .db-kpi-icon { font-size: 1.25rem; margin-bottom: 0.75rem; line-height: 1; }
        .db-kpi-value { font-family: 'Cormorant Garamond', serif; font-size: 2.2rem; font-weight: 600; color: #f5e6e8; line-height: 1; margin-bottom: 0.3rem; }
        .db-kpi-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245,230,232,0.35); font-weight: 400; }
        .db-kpi-sub { font-size: 0.72rem; color: rgba(196,69,105,0.7); margin-top: 0.4rem; font-weight: 300; }

        .db-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
        .db-row-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.25rem; margin-bottom: 1.25rem; }
        .db-card { background: rgba(255,255,255,0.02); border: 1px solid rgba(196,69,105,0.08); border-radius: 16px; padding: 1.5rem; }
        .db-card-title { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.18em; color: #c44569; font-weight: 400; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px solid rgba(196,69,105,0.1); display: flex; justify-content: space-between; align-items: center; }
        .db-card-link { font-size: 0.68rem; color: rgba(196,69,105,0.6); text-decoration: none; letter-spacing: 0.08em; transition: color 0.2s; }
        .db-card-link:hover { color: #c44569; }

        .db-bars { display: flex; flex-direction: column; gap: 0.75rem; }
        .db-bar-row { display: flex; flex-direction: column; gap: 0.3rem; }
        .db-bar-top { display: flex; justify-content: space-between; align-items: center; }
        .db-bar-label { font-size: 0.75rem; color: rgba(245,230,232,0.55); font-weight: 300; }
        .db-bar-count { font-size: 0.75rem; color: rgba(245,230,232,0.4); }
        .db-bar-track { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
        .db-bar-fill { height: 100%; border-radius: 2px; }

        .db-status-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .db-status-item { display: flex; align-items: center; gap: 0.75rem; }
        .db-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .db-status-name { font-size: 0.78rem; color: rgba(245,230,232,0.55); font-weight: 300; flex: 1; }
        .db-status-num { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: #f5e6e8; }
        .db-status-pct { font-size: 0.68rem; color: rgba(245,230,232,0.3); margin-left: 0.3rem; }

        .db-line-chart { display: flex; align-items: flex-end; gap: 3px; height: 80px; padding-top: 0.5rem; }
        .db-line-bar { flex: 1; border-radius: 3px 3px 0 0; background: linear-gradient(to top, #8b1a2e, #c44569); min-height: 3px; transition: opacity 0.2s; position: relative; cursor: default; }
        .db-line-bar:hover { opacity: 0.8; }
        .db-line-bar:hover .db-line-tooltip { opacity: 1; }
        .db-line-tooltip { position: absolute; bottom: 105%; left: 50%; transform: translateX(-50%); background: rgba(13,6,8,0.95); border: 1px solid rgba(196,69,105,0.2); color: #f5e6e8; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s; }
        .db-line-labels { display: flex; gap: 3px; margin-top: 0.4rem; }
        .db-line-label { flex: 1; font-size: 0.52rem; color: rgba(245,230,232,0.25); text-align: center; overflow: hidden; }

        .db-top-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .db-top-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .db-top-item:last-child { border-bottom: none; }
        .db-top-rank { font-family: 'Cormorant Garamond', serif; font-size: 1.2rem; font-weight: 600; color: rgba(196,69,105,0.4); width: 1.5rem; flex-shrink: 0; text-align: center; }
        .db-top-img { width: 36px; height: 36px; border-radius: 6px; object-fit: cover; background: rgba(196,69,105,0.08); flex-shrink: 0; }
        .db-top-info { flex: 1; min-width: 0; }
        .db-top-name { font-size: 0.82rem; color: #f5e6e8; font-weight: 400; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .db-top-producer { font-size: 0.68rem; color: rgba(245,230,232,0.35); font-weight: 300; }

        .db-price-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .db-price-item { background: rgba(255,255,255,0.02); border-radius: 10px; padding: 0.85rem 1rem; }
        .db-price-val { font-family: 'Cormorant Garamond', serif; font-size: 1.6rem; font-weight: 600; color: #f5e6e8; line-height: 1; }
        .db-price-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(245,230,232,0.3); margin-top: 0.2rem; }
        .db-price-expensive { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(196,69,105,0.08); }
        .db-price-expensive-label { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: rgba(245,230,232,0.3); margin-bottom: 0.4rem; }
        .db-price-expensive-name { font-size: 0.85rem; color: #f5e6e8; }
        .db-price-expensive-val { font-size: 0.78rem; color: #d4af37; margin-top: 0.1rem; }

        .db-maturity-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .db-maturity-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid rgba(255,255,255,0.03); }
        .db-maturity-item:last-child { border-bottom: none; }
        .db-maturity-year { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: #d4af37; width: 2.5rem; flex-shrink: 0; text-align: center; }
        .db-maturity-info { flex: 1; min-width: 0; }
        .db-maturity-name { font-size: 0.82rem; color: #f5e6e8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .db-maturity-sub { font-size: 0.68rem; color: rgba(245,230,232,0.35); }
        .db-maturity-badge { font-size: 0.62rem; padding: 0.2rem 0.5rem; border-radius: 20px; white-space: nowrap; }

        .db-country-list { display: flex; flex-direction: column; gap: 0.65rem; }
        .db-country-item { display: flex; align-items: center; gap: 0.6rem; }
        .db-country-name { font-size: 0.75rem; color: rgba(245,230,232,0.55); width: 80px; flex-shrink: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .db-country-bar-wrap { flex: 1; height: 5px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
        .db-country-bar { height: 100%; border-radius: 3px; background: linear-gradient(to right, #8b1a2e, #c44569); }
        .db-country-num { font-size: 0.72rem; color: rgba(245,230,232,0.4); width: 1.5rem; text-align: right; flex-shrink: 0; }

        .db-recent-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }

        .db-empty { display: flex; flex-direction: column; align-items: center; padding: 2rem; text-align: center; }
        .db-empty-icon { font-size: 2rem; margin-bottom: 0.75rem; opacity: 0.3; }
        .db-empty-text { font-size: 0.78rem; color: rgba(245,230,232,0.25); }

        @media (max-width: 1024px) {
          .db-kpis { grid-template-columns: repeat(2, 1fr); }
          .db-recent-grid { grid-template-columns: repeat(2, 1fr); }
          .db-row-3 { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 768px) {
          .db-page { padding: 5rem 1rem 3rem; }
          .db-row { grid-template-columns: 1fr; }
          .db-row-3 { grid-template-columns: 1fr; }
          .db-recent-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 480px) {
          .db-kpis { grid-template-columns: 1fr 1fr; }
          .db-recent-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="db-page">
        <div className="db-inner">

          <div className="db-header">
            <p className="db-eyebrow">Pivnița ta digitală</p>
            <CellarNameEditor initialName={cellarName} />
            <p className="db-sub">Statisticile colecției tale de vinuri</p>
          </div>
          <div className="db-divider" />

          {/* KPIs */}
          <div className="db-kpis">
            <div className="db-kpi">
              <div className="db-kpi-glow" />
              <div className="db-kpi-icon">🍾</div>
              <div className="db-kpi-value">{stats.totalBottles}</div>
              <div className="db-kpi-label">Sticle totale</div>
              <div className="db-kpi-sub">{inCellar} în pivniță</div>
            </div>
            <div className="db-kpi">
              <div className="db-kpi-glow" />
              <div className="db-kpi-icon">🍷</div>
              <div className="db-kpi-value">{stats.totalWines}</div>
              <div className="db-kpi-label">Vinuri unice</div>
              {topType && <div className="db-kpi-sub">Majoritar {TYPE_LABELS[topType[0]]}</div>}
            </div>
            <div className="db-kpi">
              <div className="db-kpi-glow" />
              <div className="db-kpi-icon">💰</div>
              <div className="db-kpi-value">{stats.totalValue > 0 ? `${Math.round(stats.totalValue)}€` : '—'}</div>
              <div className="db-kpi-label">Valoare colecție</div>
              {advanced.priceStats.avg > 0 && (
                <div className="db-kpi-sub">Media {Math.round(advanced.priceStats.avg)}€/sticlă</div>
              )}
            </div>
            <div className="db-kpi">
              <div className="db-kpi-glow" />
              <div className="db-kpi-icon">🌍</div>
              <div className="db-kpi-value">{Object.keys(advanced.byCountry).length}</div>
              <div className="db-kpi-label">Țări reprezentate</div>
              {topType && <div className="db-kpi-sub">{Object.keys(stats.byType).length} tipuri de vin</div>}
            </div>
          </div>

          {/* Row 1: Tip + Status */}
          <div className="db-row">
            <div className="db-card">
              <div className="db-card-title">
                Distribuție după tip
                <Link href="/wines" className="db-card-link">Vezi tot →</Link>
              </div>
              {Object.keys(stats.byType).length === 0 ? (
                <div className="db-empty"><div className="db-empty-icon">🍷</div><p className="db-empty-text">Nicio dată</p></div>
              ) : (
                <div className="db-bars">
                  {Object.entries(stats.byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                    const max = Math.max(...Object.values(stats.byType));
                    return (
                      <div key={type} className="db-bar-row">
                        <div className="db-bar-top">
                          <span className="db-bar-label">{TYPE_LABELS[type] ?? type}</span>
                          <span className="db-bar-count">{count}</span>
                        </div>
                        <div className="db-bar-track">
                          <div className="db-bar-fill" style={{ width: `${Math.round((count / max) * 100)}%`, background: TYPE_COLORS[type] ?? '#c44569' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="db-card">
              <div className="db-card-title">Status colecție</div>
              {Object.keys(stats.byStatus).length === 0 ? (
                <div className="db-empty"><div className="db-empty-icon">📊</div><p className="db-empty-text">Nicio dată</p></div>
              ) : (
                <div className="db-status-list">
                  {Object.entries(stats.byStatus).sort((a, b) => b[1] - a[1]).map(([status, count]) => {
                    const total = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
                    return (
                      <div key={status} className="db-status-item">
                        <div className="db-status-dot" style={{ background: STATUS_COLORS[status] ?? '#c44569' }} />
                        <span className="db-status-name">{STATUS_LABELS[status] ?? status}</span>
                        <span className="db-status-num">{count}</span>
                        <span className="db-status-pct">{total > 0 ? Math.round((count / total) * 100) : 0}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Line chart + Țări */}
          <div className="db-row">
            <div className="db-card">
              <div className="db-card-title">Achiziții lunare — ultimele 12 luni</div>
              {advanced.monthlyData.every(m => m.count === 0) ? (
                <div className="db-empty"><div className="db-empty-icon">📈</div><p className="db-empty-text">Nicio achiziție înregistrată</p></div>
              ) : (
                <>
                  <div className="db-line-chart">
                    {advanced.monthlyData.map((m, i) => (
                      <div key={i} className="db-line-bar"
                        style={{ height: `${Math.max(4, Math.round((m.count / maxMonthly) * 100))}%` }}>
                        <span className="db-line-tooltip">{m.label}: {m.count}</span>
                      </div>
                    ))}
                  </div>
                  <div className="db-line-labels">
                    {advanced.monthlyData.map((m, i) => (
                      <span key={i} className="db-line-label">{m.label}</span>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="db-card">
              <div className="db-card-title">
                Top țări
                <span style={{ fontSize: '0.65rem', color: 'rgba(245,230,232,0.25)' }}>{Object.keys(advanced.byCountry).length} țări</span>
              </div>
              {topCountries.length === 0 ? (
                <div className="db-empty"><div className="db-empty-icon">🌍</div><p className="db-empty-text">Nicio dată</p></div>
              ) : (
                <div className="db-country-list">
                  {topCountries.map(([country, count]) => (
                    <div key={country} className="db-country-item">
                      <span className="db-country-name">{country}</span>
                      <div className="db-country-bar-wrap">
                        <div className="db-country-bar" style={{ width: `${Math.round((count / totalCountryWines) * 100)}%` }} />
                      </div>
                      <span className="db-country-num">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Top vinuri + Prețuri + Maturitate */}
          <div className="db-row-3">
            <div className="db-card">
              <div className="db-card-title">Top 5 vinuri</div>
              {advanced.topWines.length === 0 ? (
                <div className="db-empty"><div className="db-empty-icon">⭐</div><p className="db-empty-text">Adaugă rating vinurilor</p></div>
              ) : (
                <div className="db-top-list">
                  {advanced.topWines.map((wine, i) => (
                    <Link key={wine.id} href={`/wines/${wine.id}`} style={{ textDecoration: 'none' }}>
                      <div className="db-top-item">
                        <span className="db-top-rank">{i + 1}</span>
                        {wine.labelImageUrl || wine.bottleImageUrl ? (
                          <img src={wine.labelImageUrl || wine.bottleImageUrl} alt={wine.name} className="db-top-img" />
                        ) : (
                          <div className="db-top-img" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🍷</div>
                        )}
                        <div className="db-top-info">
                          <div className="db-top-name">{wine.name}</div>
                          <div className="db-top-producer">
                            <Stars rating={wine.rating} />
                            <span style={{ marginLeft: '0.3rem', color: 'rgba(245,230,232,0.3)', fontSize: '0.65rem' }}>{STAR_LABELS[wine.rating]}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="db-card">
              <div className="db-card-title">Statistici preț</div>
              {advanced.priceStats.avg === 0 ? (
                <div className="db-empty"><div className="db-empty-icon">💰</div><p className="db-empty-text">Adaugă prețuri vinurilor</p></div>
              ) : (
                <>
                  <div className="db-price-grid">
                    <div className="db-price-item">
                      <div className="db-price-val">{Math.round(advanced.priceStats.avg)}€</div>
                      <div className="db-price-label">Preț mediu</div>
                    </div>
                    <div className="db-price-item">
                      <div className="db-price-val">{Math.round(advanced.priceStats.max)}€</div>
                      <div className="db-price-label">Cel mai scump</div>
                    </div>
                    <div className="db-price-item">
                      <div className="db-price-val">{Math.round(advanced.priceStats.min)}€</div>
                      <div className="db-price-label">Cel mai ieftin</div>
                    </div>
                    <div className="db-price-item">
                      <div className="db-price-val">{Math.round(stats.totalValue)}€</div>
                      <div className="db-price-label">Valoare totală</div>
                    </div>
                  </div>
                  {advanced.priceStats.mostExpensive && (
                    <div className="db-price-expensive">
                      <div className="db-price-expensive-label">Cel mai scump vin</div>
                      <Link href={`/wines/${advanced.priceStats.mostExpensive.id}`} style={{ textDecoration: 'none' }}>
                        <div className="db-price-expensive-name">{advanced.priceStats.mostExpensive.name}</div>
                        <div className="db-price-expensive-val">{advanced.priceStats.mostExpensive.purchasePrice}€</div>
                      </Link>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Aproape de maturitate */}
            <div className="db-card">
              <div className="db-card-title">
                Aproape de maturitate
                <span style={{ fontSize: '0.65rem', color: 'rgba(245,230,232,0.25)' }}>3 ani</span>
              </div>
              {advanced.nearMaturity.length === 0 ? (
                <div className="db-empty">
                  <div className="db-empty-icon">⏳</div>
                  <p className="db-empty-text">Adaugă fereastra de consum la vinuri (câmpurile "De la / Până la" din formular)</p>
                </div>
              ) : (
                <div className="db-maturity-list">
                  {advanced.nearMaturity.map(wine => {
                    const yearsLeft = wine.readyYear - currentYear;
                    const isNow = yearsLeft <= 0;
                    return (
                      <Link key={wine.id} href={`/wines/${wine.id}`} style={{ textDecoration: 'none' }}>
                        <div className="db-maturity-item">
                          <span className="db-maturity-year">{wine.readyYear}</span>
                          <div className="db-maturity-info">
                            <div className="db-maturity-name">{wine.name}</div>
                            <div className="db-maturity-sub">{wine.producer ?? wine.country ?? '—'}</div>
                          </div>
                          <span className="db-maturity-badge" style={{
                            background: isNow ? 'rgba(85,196,78,0.1)' : 'rgba(212,175,55,0.1)',
                            color: isNow ? 'rgba(85,196,78,0.9)' : '#d4af37',
                            border: `1px solid ${isNow ? 'rgba(85,196,78,0.2)' : 'rgba(212,175,55,0.2)'}`,
                          }}>
                            {isNow ? '🟢 Acum!' : `${yearsLeft}a`}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Vinuri recente */}
          <div className="db-card">
            <div className="db-card-title">
              Adăugate recent
              <Link href="/wines" className="db-card-link">Vezi tot →</Link>
            </div>
            {recentWines.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-icon">🍷</div>
                <p className="db-empty-text" style={{ marginBottom: '1rem' }}>Colecția ta e goală. Adaugă primul vin!</p>
                <Link href="/wines/add" style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, #8b1a2e, #c44569)', color: '#f5e6e8', textDecoration: 'none', borderRadius: '8px', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  + Adaugă vin
                </Link>
              </div>
            ) : (
              <div className="db-recent-grid">
                {recentWines.map(wine => <WineCard key={wine.id} wine={wine} />)}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}