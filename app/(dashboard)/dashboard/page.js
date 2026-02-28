import Link from 'next/link';
import { getDashboardStats, getWines } from '@/utils/actions';
import WineCard from '@/components/wines/WineCard';

export const metadata = { title: 'Dashboard — Vinerys' };

const TYPE_LABELS = { RED: 'Roșu', WHITE: 'Alb', ROSE: 'Roze', SPARKLING: 'Spumant', DESSERT: 'Desert', FORTIFIED: 'Fortifiat' };
const TYPE_COLORS = { RED: '#8b1a2e', WHITE: '#d4af37', ROSE: '#c44569', SPARKLING: '#b4c8dc', DESSERT: '#b47828', FORTIFIED: '#643078' };
const STATUS_LABELS = { IN_CELLAR: 'În pivniță', CONSUMED: 'Consumat', SOLD: 'Vândut', GIFTED: 'Dăruit' };
const STATUS_COLORS = { IN_CELLAR: '#55c44e', CONSUMED: 'rgba(245,230,232,0.3)', SOLD: '#d4af37', GIFTED: '#c44569' };

export default async function DashboardPage() {
  let stats = { totalBottles: 0, totalValue: 0, totalWines: 0, byType: {}, byStatus: {} };
  let recentWines = [];

  try {
    [stats, recentWines] = await Promise.all([
      getDashboardStats(),
      getWines(),
    ]);
    recentWines = recentWines.slice(0, 4);
  } catch {}

  const topType = Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0];
  const inCellar = stats.byStatus?.IN_CELLAR ?? 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        .db-page {
          min-height: 100vh;
          background: #0d0608;
          padding: 6rem 1.5rem 4rem;
          font-family: 'Jost', sans-serif;
        }
        .db-inner { max-width: 1200px; margin: 0 auto; }

        /* Header */
        .db-header { margin-bottom: 2.5rem; }
        .db-eyebrow { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.2em; color: #c44569; margin-bottom: 0.4rem; }
        .db-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(2rem, 4vw, 3rem); font-weight: 300; color: #f5e6e8; line-height: 1; letter-spacing: -0.02em; }
        .db-sub { font-size: 0.82rem; color: rgba(245,230,232,0.35); font-weight: 300; margin-top: 0.4rem; }

        .db-divider { height: 1px; background: linear-gradient(to right, rgba(196,69,105,0.3), transparent); margin-bottom: 2.5rem; }

        /* KPI cards */
        .db-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(196,69,105,0.08);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 2rem;
          border: 1px solid rgba(196,69,105,0.08);
        }
        .db-kpi {
          background: rgba(13,6,8,0.95);
          padding: 1.75rem 1.5rem;
          position: relative;
          overflow: hidden;
          transition: background 0.3s;
        }
        .db-kpi:hover { background: rgba(255,255,255,0.02); }
        .db-kpi-glow {
          position: absolute;
          bottom: -20px; right: -20px;
          width: 80px; height: 80px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,69,105,0.15), transparent);
          pointer-events: none;
        }
        .db-kpi-icon { font-size: 1.25rem; margin-bottom: 0.75rem; line-height: 1; }
        .db-kpi-value {
          font-family: 'Cormorant Garamond', serif;
          font-size: 2.2rem;
          font-weight: 600;
          color: #f5e6e8;
          line-height: 1;
          margin-bottom: 0.3rem;
        }
        .db-kpi-label { font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.15em; color: rgba(245,230,232,0.35); font-weight: 400; }
        .db-kpi-sub { font-size: 0.72rem; color: rgba(196,69,105,0.7); margin-top: 0.4rem; font-weight: 300; }

        /* Two col layout */
        .db-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }

        .db-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(196,69,105,0.08);
          border-radius: 16px;
          padding: 1.5rem;
        }
        .db-card-title {
          font-size: 0.68rem;
          text-transform: uppercase;
          letter-spacing: 0.18em;
          color: #c44569;
          font-weight: 400;
          margin-bottom: 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(196,69,105,0.1);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .db-card-link {
          font-size: 0.68rem;
          color: rgba(196,69,105,0.6);
          text-decoration: none;
          letter-spacing: 0.08em;
          transition: color 0.2s;
        }
        .db-card-link:hover { color: #c44569; }

        /* Bar chart */
        .db-bars { display: flex; flex-direction: column; gap: 0.75rem; }
        .db-bar-row { display: flex; flex-direction: column; gap: 0.3rem; }
        .db-bar-top { display: flex; justify-content: space-between; align-items: center; }
        .db-bar-label { font-size: 0.75rem; color: rgba(245,230,232,0.55); font-weight: 300; }
        .db-bar-count { font-size: 0.75rem; color: rgba(245,230,232,0.4); font-weight: 400; }
        .db-bar-track { height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
        .db-bar-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }

        /* Status donut simple */
        .db-status-list { display: flex; flex-direction: column; gap: 0.75rem; }
        .db-status-item { display: flex; align-items: center; gap: 0.75rem; }
        .db-status-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
        .db-status-name { font-size: 0.78rem; color: rgba(245,230,232,0.55); font-weight: 300; flex: 1; }
        .db-status-num { font-family: 'Cormorant Garamond', serif; font-size: 1.1rem; font-weight: 600; color: #f5e6e8; }
        .db-status-pct { font-size: 0.68rem; color: rgba(245,230,232,0.3); margin-left: 0.3rem; }

        /* Recent wines */
        .db-recent-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }

        /* Empty */
        .db-empty {
          display: flex; flex-direction: column; align-items: center;
          padding: 3rem; text-align: center;
          border: 1px dashed rgba(196,69,105,0.15);
          border-radius: 12px;
        }
        .db-empty-icon { font-size: 2.5rem; margin-bottom: 1rem; opacity: 0.3; }
        .db-empty-text { font-size: 0.82rem; color: rgba(245,230,232,0.3); margin-bottom: 1rem; }
        .db-empty-btn {
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, #8b1a2e, #c44569);
          color: #f5e6e8; text-decoration: none;
          border-radius: 8px; font-size: 0.75rem;
          letter-spacing: 0.1em; text-transform: uppercase;
          transition: all 0.3s;
        }
        .db-empty-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(196,69,105,0.35); }

        @media (max-width: 1024px) {
          .db-kpis { grid-template-columns: repeat(2, 1fr); }
          .db-recent-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .db-page { padding: 5rem 1rem 3rem; }
          .db-row { grid-template-columns: 1fr; }
          .db-kpis { grid-template-columns: repeat(2, 1fr); }
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
            <p className="db-eyebrow">Privire de ansamblu</p>
            <h1 className="db-title">Dashboard</h1>
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
            </div>
            <div className="db-kpi">
              <div className="db-kpi-glow" />
              <div className="db-kpi-icon">📊</div>
              <div className="db-kpi-value">{Object.keys(stats.byType).length}</div>
              <div className="db-kpi-label">Tipuri de vin</div>
            </div>
          </div>

          {/* Charts row */}
          <div className="db-row">
            {/* By type */}
            <div className="db-card">
              <div className="db-card-title">
                Distribuție după tip
                <Link href="/wines" className="db-card-link">Vezi tot →</Link>
              </div>
              {Object.keys(stats.byType).length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'rgba(245,230,232,0.25)', textAlign: 'center', padding: '2rem 0' }}>Nicio dată disponibilă</p>
              ) : (
                <div className="db-bars">
                  {Object.entries(stats.byType)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => {
                      const max = Math.max(...Object.values(stats.byType));
                      const pct = Math.round((count / max) * 100);
                      return (
                        <div key={type} className="db-bar-row">
                          <div className="db-bar-top">
                            <span className="db-bar-label">{TYPE_LABELS[type] ?? type}</span>
                            <span className="db-bar-count">{count}</span>
                          </div>
                          <div className="db-bar-track">
                            <div className="db-bar-fill" style={{ width: `${pct}%`, background: TYPE_COLORS[type] ?? '#c44569' }} />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* By status */}
            <div className="db-card">
              <div className="db-card-title">Status colecție</div>
              {Object.keys(stats.byStatus).length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'rgba(245,230,232,0.25)', textAlign: 'center', padding: '2rem 0' }}>Nicio dată disponibilă</p>
              ) : (
                <div className="db-status-list">
                  {Object.entries(stats.byStatus)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => {
                      const total = Object.values(stats.byStatus).reduce((a, b) => a + b, 0);
                      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                      return (
                        <div key={status} className="db-status-item">
                          <div className="db-status-dot" style={{ background: STATUS_COLORS[status] ?? '#c44569' }} />
                          <span className="db-status-name">{STATUS_LABELS[status] ?? status}</span>
                          <span className="db-status-num">{count}</span>
                          <span className="db-status-pct">{pct}%</span>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>

          {/* Recent wines */}
          <div className="db-card">
            <div className="db-card-title">
              Adăugate recent
              <Link href="/wines" className="db-card-link">Vezi tot →</Link>
            </div>
            {recentWines.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-icon">🍷</div>
                <p className="db-empty-text">Colecția ta e goală. Adaugă primul vin!</p>
                <Link href="/wines/add" className="db-empty-btn">+ Adaugă vin</Link>
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
