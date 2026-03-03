export default function Loading() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300&family=Jost:wght@300;400&display=swap');

        .sk-page {
          min-height: 100vh;
          background: #0d0608;
          padding: 6rem 1.5rem 4rem;
          font-family: 'Jost', sans-serif;
        }
        .sk-inner { max-width: 1200px; margin: 0 auto; }

        @keyframes shimmer {
          0%   { background-position: -800px 0; }
          100% { background-position:  800px 0; }
        }

        .sk {
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.03) 25%,
            rgba(196,69,105,0.06) 50%,
            rgba(255,255,255,0.03) 75%
          );
          background-size: 800px 100%;
          animation: shimmer 1.6s infinite linear;
          border-radius: 8px;
        }

        /* Header */
        .sk-header { margin-bottom: 2.5rem; }
        .sk-eyebrow { height: 10px; width: 80px; margin-bottom: 0.75rem; }
        .sk-title   { height: 42px; width: 260px; border-radius: 6px; }

        .sk-divider {
          height: 1px;
          background: linear-gradient(to right, rgba(196,69,105,0.15), transparent);
          margin-bottom: 2.5rem;
        }

        /* KPI cards */
        .sk-kpis {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: rgba(196,69,105,0.06);
          border-radius: 16px;
          overflow: hidden;
          margin-bottom: 2rem;
          border: 1px solid rgba(196,69,105,0.06);
        }
        .sk-kpi {
          background: rgba(13,6,8,0.95);
          padding: 1.75rem 1.5rem;
          display: flex; flex-direction: column; gap: 0.75rem;
        }
        .sk-kpi-icon  { height: 22px; width: 22px; border-radius: 6px; }
        .sk-kpi-value { height: 36px; width: 80px; border-radius: 6px; }
        .sk-kpi-label { height: 10px; width: 100px; }
        .sk-kpi-sub   { height: 10px; width: 70px; }

        /* Filter bar */
        .sk-filters { display: flex; gap: 0.65rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .sk-filter-search { height: 42px; flex: 2; min-width: 200px; border-radius: 8px; }
        .sk-filter-select { height: 42px; width: 140px; border-radius: 8px; }
        .sk-filter-btn    { height: 42px; width: 120px; border-radius: 8px; }

        /* Sort row */
        .sk-sort-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .sk-sort-left { display: flex; gap: 0.5rem; }
        .sk-sort-sel { height: 34px; width: 140px; border-radius: 8px; }
        .sk-count { height: 16px; width: 80px; border-radius: 4px; }

        /* Wine grid */
        .sk-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 1.25rem;
        }
        .sk-card {
          border-radius: 14px;
          overflow: hidden;
          border: 1px solid rgba(196,69,105,0.06);
          background: rgba(255,255,255,0.02);
        }
        .sk-card-img  { height: 180px; border-radius: 0; }
        .sk-card-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.6rem; }
        .sk-card-name  { height: 18px; width: 70%; border-radius: 5px; }
        .sk-card-prod  { height: 12px; width: 50%; border-radius: 4px; }
        .sk-card-meta  { height: 10px; width: 60%; border-radius: 4px; }
        .sk-card-stars { height: 16px; width: 80px; border-radius: 4px; margin-top: 0.25rem; }

        /* Two-col row for dashboard */
        .sk-row {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 1.25rem; margin-bottom: 1.25rem;
        }
        .sk-chart-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(196,69,105,0.06);
          border-radius: 16px; padding: 1.5rem;
        }
        .sk-chart-title { height: 10px; width: 130px; margin-bottom: 1.25rem; border-radius: 4px; }
        .sk-bar-row { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.75rem; }
        .sk-bar-top { display: flex; justify-content: space-between; }
        .sk-bar-lbl { height: 10px; width: 70px; border-radius: 3px; }
        .sk-bar-num { height: 10px; width: 20px; border-radius: 3px; }
        .sk-bar     { height: 4px; border-radius: 2px; }

        @media (max-width: 1024px) { .sk-kpis { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 768px)  { .sk-row { grid-template-columns: 1fr; } .sk-page { padding: 5rem 1rem 3rem; } }
        @media (max-width: 640px)  { .sk-filter-select, .sk-filter-btn { display: none; } }
      `}</style>

      <div className="sk-page">
        <div className="sk-inner">

          {/* Header */}
          <div className="sk-header">
            <div className="sk sk-eyebrow" />
            <div className="sk sk-title" />
          </div>
          <div className="sk-divider" />

          {/* KPIs */}
          <div className="sk-kpis">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="sk-kpi">
                <div className="sk sk-kpi-icon" />
                <div className="sk sk-kpi-value" />
                <div className="sk sk-kpi-label" />
                <div className="sk sk-kpi-sub" />
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="sk-filters">
            <div className="sk sk-filter-search" />
            <div className="sk sk-filter-select" />
            <div className="sk sk-filter-select" />
            <div className="sk sk-filter-btn" />
          </div>

          {/* Sort row */}
          <div className="sk-sort-row">
            <div className="sk-sort-left">
              <div className="sk sk-sort-sel" />
              <div className="sk sk-sort-sel" />
            </div>
            <div className="sk sk-count" />
          </div>

          {/* Wine grid */}
          <div className="sk-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="sk-card">
                <div className="sk sk-card-img" />
                <div className="sk-card-body">
                  <div className="sk sk-card-name" />
                  <div className="sk sk-card-prod" />
                  <div className="sk sk-card-meta" />
                  <div className="sk sk-card-stars" />
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}
