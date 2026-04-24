import Link from 'next/link';
import { getDashboardStats, getWines, getAdvancedStats, getProfile } from '@/utils/actions';
import WineCard from '@/components/wines/WineCard';
import CellarNameEditor from '@/components/CellarNameEditor';
import {
  Wine,
  TrendingUp,
  Globe,
  BarChart2,
  CalendarClock,
  Star,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

/* ─── Custom KPI icons (SVG inline) ─────────────────────────────────────── */
function IconBottles({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 2h2v2.5c0 .28.1.54.27.74L13 7.5V18a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7.5l1.73-2.26A1 1 0 0 0 9 4.5V2Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M7 10.5h6" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M15 4h1.5a1 1 0 0 1 1 1v1a1 1 0 0 0 1 1H19v11a1 1 0 0 1-1 1h-1.5" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

function IconCellar({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="11" rx="7" ry="4" stroke={color} strokeWidth="1.3"/>
      <path d="M5 11v5c0 2.21 3.13 4 7 4s7-1.79 7-4v-5" stroke={color} strokeWidth="1.3"/>
      <path d="M5 14c0 2.21 3.13 4 7 4s7-1.79 7-4" stroke={color} strokeWidth="1.3" strokeDasharray="2 2"/>
      <circle cx="12" cy="11" r="1.5" fill={color} opacity=".4"/>
    </svg>
  );
}

function IconValue({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 3l2.5 5.5L21 9.5l-4.5 4.5 1 6.5L12 17.5 6.5 20.5l1-6.5L3 9.5l6.5-1L12 3Z" stroke={color} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M12 8v5M10 11h4" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function IconGlobe({ color }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.3"/>
      <path d="M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9" stroke={color} strokeWidth="1.2"/>
      <path d="M3.5 9h17M3.5 15h17" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export async function generateMetadata() {
  try {
    const profile = await getProfile();
    const name = profile?.cellarName || 'Dashboard';
    return { title: name + ' — Vinerys' };
  } catch {
    return { title: 'Dashboard — Vinerys' };
  }
}

const TYPE_LABELS   = { RED: 'Roșu', WHITE: 'Alb', ROSE: 'Roze', SPARKLING: 'Spumant', DESSERT: 'Desert', FORTIFIED: 'Fortifiat' };
const TYPE_COLORS   = { RED: '#8b1a2e', WHITE: '#d4af37', ROSE: '#c44569', SPARKLING: '#b4c8dc', DESSERT: '#b47828', FORTIFIED: '#643078' };
const STATUS_LABELS = { IN_CELLAR: 'În pivniță', CONSUMED: 'Consumat', SOLD: 'Vândut', GIFTED: 'Dăruit' };
const STATUS_COLORS = { IN_CELLAR: '#55c44e', CONSUMED: 'rgba(245,230,232,0.3)', SOLD: '#d4af37', GIFTED: '#c44569' };
const STAR_LABELS   = { 5: 'Excepțional', 4: 'Excelent', 3: 'Bun', 2: 'Decent', 1: 'Slab' };

function Stars({ rating }) {
  return (
    <span style={{ color: '#d4af37', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  );
}

/* ─── KPI Card — icon top-right, value large bottom-left ─── */
function KpiCard({ iconEl, value, label, sub, accentColor, iconBg }) {
  return (
    <div className="db-kpi">
      <div className="db-kpi-bar" style={{
        background: `linear-gradient(to bottom, ${accentColor} 0%, transparent 75%)`
      }} />
      <div className="db-kpi-glow" style={{
        background: `radial-gradient(ellipse 60% 50% at 0% 100%, ${accentColor}1a 0%, transparent 100%)`
      }} />
      <div className="db-kpi-pattern" />

      {/* TOP ROW: label left + icon right */}
      <div className="db-kpi-top-row">
        <div className="db-kpi-label">{label}</div>
        <div className="db-kpi-icon-wrap" style={{
          background: iconBg,
          boxShadow: `0 0 0 1px ${accentColor}30, 0 6px 16px ${accentColor}18`
        }}>
          {iconEl}
        </div>
      </div>

      {/* BOTTOM: big number */}
      <div className="db-kpi-body">
        <div className="db-kpi-value">{value}</div>
      </div>

      {sub && (
        <div className="db-kpi-badge" style={{
          background: `${accentColor}0f`,
          color: accentColor,
          border: `1px solid ${accentColor}22`,
        }}>
          <span className="db-kpi-dot" style={{ background: accentColor }} />
          {sub}
        </div>
      )}
    </div>
  );
}

/* ─── Empty state ───────────────────────────────────────────────────────── */
function Empty({ icon: Icon, text }) {
  return (
    <div className="db-empty">
      <div className="db-empty-icon"><Icon size={26} strokeWidth={1} color="rgba(245,230,232,0.2)" /></div>
      <p className="db-empty-text">{text}</p>
    </div>
  );
}

/* ─── Card title row ────────────────────────────────────────────────────── */
function CardTitle({ children, href, aside }) {
  return (
    <div className="db-card-title">
      <span>{children}</span>
      {href && (
        <Link href={href} className="db-card-link">
          Vezi tot <ArrowRight size={11} strokeWidth={1.5} />
        </Link>
      )}
      {aside && <span className="db-card-aside">{aside}</span>}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────── */
export default async function DashboardPage() {
  let stats    = { totalBottles: 0, totalValue: 0, totalWines: 0, byType: {}, byStatus: {} };
  let recentWines = [];
  let advanced = {
    topWines: [], byCountry: {}, monthlyData: [],
    priceStats: { avg: 0, max: 0, min: 0, mostExpensive: null },
    nearMaturity: [],
    overdueWines: [],
  };
  let cellarName = 'Dashboard';

  try {
    const [s, winesResult, adv, profile] = await Promise.all([
      getDashboardStats(),
      getWines({ sort: 'newest', pageSize: '4', page: '1' }),
      getAdvancedStats(),
      getProfile(),
    ]);
    stats       = s;
    recentWines = winesResult.wines ?? [];
    advanced    = adv;
    cellarName  = profile?.cellarName || 'Dashboard';
  } catch {}

  const topType           = Object.entries(stats.byType).sort((a, b) => b[1] - a[1])[0];
  const inCellar          = stats.byStatus?.IN_CELLAR ?? 0;
  const maxMonthly        = Math.max(...advanced.monthlyData.map(m => m.count), 1);
  const topCountries      = Object.entries(advanced.byCountry).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const totalCountryWines = topCountries.reduce((a, [, v]) => a + v, 0) || 1;
  const currentYear       = new Date().getFullYear();

  // Vinuri depășite — vin direct din backend (drinkUntil < currentYear)
  const overdueWines = advanced.overdueWines ?? [];

  // Wines ready now (în fereastră)
  const readyNowWines = (advanced.nearMaturity || []).filter(w => {
    const ready = w.readyYear <= currentYear;
    const notOver = !w.drinkUntil || w.drinkUntil >= currentYear;
    return ready && notOver;
  });

  // Wines near maturity (urmează în 3 ani)
  const nearMaturityWines = (advanced.nearMaturity || []).filter(w => {
    const yearsLeft = w.readyYear - currentYear;
    return yearsLeft > 0 && yearsLeft <= 3;
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&family=Jost:wght@300;400;500&display=swap');

        /* ── Base ── */
        .db-page  { min-height:100vh; background:#0d0608; padding:6rem 1.5rem 4rem; font-family:'Jost',sans-serif; }
        .db-inner { max-width:1200px; margin:0 auto; }

        /* ── Header ── */
        .db-header  { margin-bottom:2rem; }
        .db-eyebrow { font-size:.7rem; text-transform:uppercase; letter-spacing:.2em; color:#c44569; margin-bottom:.4rem; }
        .db-title   { font-family:'Cormorant Garamond',serif; font-size:clamp(2rem,4vw,3rem); font-weight:300; color:#f5e6e8; line-height:1; letter-spacing:-.02em; }
        .db-sub     { font-size:.82rem; color:rgba(245,230,232,.35); font-weight:300; margin-top:.4rem; }
        .db-divider { height:1px; background:linear-gradient(to right,rgba(196,69,105,.3),transparent); margin-bottom:2rem; }

        /* ── KPI grid ── */
        .db-kpis {
          display:grid;
          grid-template-columns:repeat(4,1fr);
          gap:1px;
          background:rgba(196,69,105,.07);
          border-radius:16px;
          overflow:hidden;
          border:1px solid rgba(196,69,105,.1);
          margin-bottom:1.5rem;
        }

        .db-kpi {
          background:#0d0608;
          padding:1.4rem 1.4rem 1.2rem;
          position:relative;
          overflow:hidden;
          display:flex;
          flex-direction:column;
          gap:.1rem;
          transition:background .25s;
          min-height:150px;
        }
        .db-kpi:hover { background:rgba(255,255,255,.018); }

        /* accent bar */
        .db-kpi-bar {
          position:absolute;
          left:0; top:0; bottom:0;
          width:3px;
        }

        /* glow */
        .db-kpi-glow {
          position:absolute;
          inset:0;
          pointer-events:none;
        }

        /* dot pattern */
        .db-kpi-pattern {
          position:absolute;
          inset:0;
          pointer-events:none;
          opacity:.045;
          background-image:radial-gradient(circle, rgba(245,230,232,.9) 1px, transparent 1px);
          background-size:16px 16px;
          mask-image:linear-gradient(225deg, rgba(0,0,0,.9) 0%, transparent 55%);
          -webkit-mask-image:linear-gradient(225deg, rgba(0,0,0,.9) 0%, transparent 55%);
        }

        /* ── TOP ROW: label + icon ── */
        .db-kpi-top-row {
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          position:relative; z-index:1;
        }

        .db-kpi-label {
          font-size:.62rem;
          text-transform:uppercase;
          letter-spacing:.18em;
          color:rgba(245,230,232,.3);
          font-weight:400;
          line-height:1.3;
          max-width:70%;
        }

        /* icon — now top-right, larger */
        .db-kpi-icon-wrap {
          width:44px; height:44px;
          border-radius:13px;
          display:flex; align-items:center; justify-content:center;
          flex-shrink:0;
          position:relative; z-index:1;
          transition:transform .25s, box-shadow .25s;
        }
        .db-kpi:hover .db-kpi-icon-wrap {
          transform:translateY(-2px) scale(1.04);
        }

        /* value + label */
        .db-kpi-body {
          flex:1;
          display:flex;
          align-items:flex-end;
          position:relative; z-index:1;
          margin-top:.3rem;
        }
        .db-kpi-value {
          font-family:'Cormorant Garamond',serif;
          font-size:3.4rem;
          font-weight:600;
          color:#f5e6e8;
          line-height:1;
          letter-spacing:-.03em;
        }

        /* badge */
        .db-kpi-badge {
          display:inline-flex;
          align-items:center;
          gap:5px;
          font-size:.67rem;
          font-weight:400;
          padding:.2rem .55rem;
          border-radius:20px;
          line-height:1.5;
          margin-top:.8rem;
          align-self:flex-start;
          position:relative; z-index:1;
        }
        .db-kpi-dot {
          width:5px; height:5px;
          border-radius:50%;
          flex-shrink:0;
          opacity:.8;
        }

        /* ── Shared card ── */
        .db-row   { display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.25rem; }
        .db-row-3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:1.25rem; margin-bottom:1.25rem; }

        .db-card {
          background:#0d0608;
          border:1px solid rgba(196,69,105,.1);
          border-radius:16px;
          padding:1.5rem;
        }

        .db-card-title {
          font-size:.65rem;
          text-transform:uppercase;
          letter-spacing:.18em;
          color:#c44569;
          font-weight:400;
          margin-bottom:1.25rem;
          padding-bottom:.75rem;
          border-bottom:1px solid rgba(196,69,105,.08);
          display:flex;
          justify-content:space-between;
          align-items:center;
        }
        .db-card-link {
          font-size:.65rem;
          color:rgba(196,69,105,.5);
          text-decoration:none;
          letter-spacing:.08em;
          display:flex; align-items:center; gap:3px;
          transition:color .2s;
        }
        .db-card-link:hover { color:#c44569; }
        .db-card-aside {
          font-size:.65rem;
          color:rgba(245,230,232,.2);
          letter-spacing:.05em;
        }

        /* ── URGENT / OVERDUE SECTION ── */
        .db-urgent-card {
          background: linear-gradient(135deg, rgba(180,40,30,.12) 0%, rgba(13,6,8,1) 60%);
          border:1px solid rgba(220,60,40,.25);
          border-radius:16px;
          padding:1.5rem;
          margin-bottom:1.25rem;
          position:relative;
          overflow:hidden;
        }
        .db-urgent-card::before {
          content:'';
          position:absolute;
          top:0; left:0; right:0;
          height:2px;
          background: linear-gradient(to right, #dc3c28, #ff6b4a, transparent);
        }
        .db-urgent-glow {
          position:absolute;
          top:-40px; left:-40px;
          width:200px; height:200px;
          background:radial-gradient(circle, rgba(220,60,40,.12) 0%, transparent 70%);
          pointer-events:none;
        }
        .db-urgent-title {
          font-size:.65rem;
          text-transform:uppercase;
          letter-spacing:.18em;
          color:#ff6b4a;
          font-weight:400;
          margin-bottom:1.25rem;
          padding-bottom:.75rem;
          border-bottom:1px solid rgba(220,60,40,.15);
          display:flex;
          justify-content:space-between;
          align-items:center;
        }
        .db-urgent-title-icon {
          display:flex;
          align-items:center;
          gap:.5rem;
        }
        .db-urgent-pulse {
          width:8px; height:8px;
          border-radius:50%;
          background:#ff4444;
          box-shadow:0 0 0 0 rgba(255,68,68,.5);
          animation:pulse-ring 1.8s ease-out infinite;
          flex-shrink:0;
        }
        @keyframes pulse-ring {
          0%   { box-shadow:0 0 0 0 rgba(255,68,68,.6); }
          70%  { box-shadow:0 0 0 8px rgba(255,68,68,0); }
          100% { box-shadow:0 0 0 0 rgba(255,68,68,0); }
        }
        .db-urgent-count {
          font-size:.65rem;
          background:rgba(255,68,68,.15);
          color:#ff6b4a;
          border:1px solid rgba(255,68,68,.25);
          border-radius:20px;
          padding:.15rem .6rem;
          font-weight:500;
          letter-spacing:.05em;
        }

        .db-urgent-list { display:flex; flex-direction:column; gap:.5rem; }
        .db-urgent-item {
          display:flex;
          align-items:center;
          gap:.75rem;
          padding:.7rem .9rem;
          background:rgba(220,60,40,.06);
          border:1px solid rgba(220,60,40,.1);
          border-radius:10px;
          text-decoration:none;
          transition:background .2s, border-color .2s;
        }
        .db-urgent-item:hover {
          background:rgba(220,60,40,.1);
          border-color:rgba(220,60,40,.2);
        }
        .db-urgent-year {
          font-family:'Cormorant Garamond',serif;
          font-size:1.15rem;
          font-weight:600;
          color:#ff8870;
          width:2.8rem;
          flex-shrink:0;
        }
        .db-urgent-info { flex:1; min-width:0; }
        .db-urgent-name {
          font-size:.82rem;
          color:#f5e6e8;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .db-urgent-sub {
          font-size:.68rem;
          color:rgba(245,230,232,.3);
          margin-top:.1rem;
        }
        .db-urgent-badge {
          font-size:.63rem;
          padding:.2rem .55rem;
          border-radius:20px;
          background:rgba(255,68,68,.12);
          color:#ff6b6b;
          border:1px solid rgba(255,68,68,.2);
          white-space:nowrap;
          flex-shrink:0;
        }
        .db-urgent-overdue-num {
          font-weight:600;
        }

        /* ── Bar charts ── */
        .db-bars      { display:flex; flex-direction:column; gap:.75rem; }
        .db-bar-row   { display:flex; flex-direction:column; gap:.3rem; }
        .db-bar-top   { display:flex; justify-content:space-between; align-items:center; }
        .db-bar-label { font-size:.75rem; color:rgba(245,230,232,.5); font-weight:300; }
        .db-bar-count { font-size:.75rem; color:rgba(245,230,232,.35); }
        .db-bar-track { height:3px; background:rgba(255,255,255,.05); border-radius:2px; overflow:hidden; }
        .db-bar-fill  { height:100%; border-radius:2px; }

        /* ── Status list ── */
        .db-status-list { display:flex; flex-direction:column; gap:.8rem; }
        .db-status-item { display:flex; align-items:center; gap:.75rem; }
        .db-status-dot  { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
        .db-status-name { font-size:.78rem; color:rgba(245,230,232,.5); font-weight:300; flex:1; }
        .db-status-num  { font-family:'Cormorant Garamond',serif; font-size:1.1rem; font-weight:600; color:#f5e6e8; }
        .db-status-pct  { font-size:.68rem; color:rgba(245,230,232,.25); margin-left:.3rem; }

        /* ── Monthly chart ── */
        .db-line-chart   { display:flex; align-items:flex-end; gap:3px; height:80px; padding-top:.5rem; }
        .db-line-bar     { flex:1; border-radius:3px 3px 0 0; background:linear-gradient(to top,#8b1a2e,#c44569); min-height:3px; position:relative; cursor:default; transition:opacity .2s; }
        .db-line-bar:hover { opacity:.75; }
        .db-line-bar:hover .db-line-tooltip { opacity:1; }
        .db-line-tooltip { position:absolute; bottom:105%; left:50%; transform:translateX(-50%); background:rgba(13,6,8,.95); border:1px solid rgba(196,69,105,.2); color:#f5e6e8; font-size:.65rem; padding:2px 6px; border-radius:4px; white-space:nowrap; opacity:0; pointer-events:none; transition:opacity .15s; }
        .db-line-labels  { display:flex; gap:3px; margin-top:.4rem; }
        .db-line-label   { flex:1; font-size:.52rem; color:rgba(245,230,232,.2); text-align:center; overflow:hidden; }

        /* ── Top wines ── */
        .db-top-list { display:flex; flex-direction:column; }
        .db-top-item { display:flex; align-items:center; gap:.75rem; padding:.55rem 0; border-bottom:1px solid rgba(255,255,255,.03); text-decoration:none; }
        .db-top-item:last-child { border-bottom:none; }
        .db-top-rank { font-family:'Cormorant Garamond',serif; font-size:1.1rem; font-weight:600; color:rgba(196,69,105,.35); width:1.4rem; flex-shrink:0; text-align:center; }
        .db-top-img  { width:34px; height:34px; border-radius:6px; object-fit:cover; background:rgba(196,69,105,.08); flex-shrink:0; display:flex; align-items:center; justify-content:center; }
        .db-top-info { flex:1; min-width:0; }
        .db-top-name { font-size:.82rem; color:#f5e6e8; font-weight:400; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .db-top-meta { font-size:.68rem; color:rgba(245,230,232,.3); font-weight:300; margin-top:.1rem; }

        /* ── Price stats ── */
        .db-price-grid  { display:grid; grid-template-columns:1fr 1fr; gap:.75rem; }
        .db-price-item  { background:rgba(255,255,255,.025); border:1px solid rgba(196,69,105,.07); border-radius:10px; padding:.8rem 1rem; }
        .db-price-val   { font-family:'Cormorant Garamond',serif; font-size:1.55rem; font-weight:600; color:#f5e6e8; line-height:1; }
        .db-price-lbl   { font-size:.62rem; text-transform:uppercase; letter-spacing:.12em; color:rgba(245,230,232,.25); margin-top:.2rem; }
        .db-price-best  { margin-top:.9rem; padding-top:.9rem; border-top:1px solid rgba(196,69,105,.07); }
        .db-price-best-lbl  { font-size:.62rem; text-transform:uppercase; letter-spacing:.12em; color:rgba(245,230,232,.25); margin-bottom:.35rem; }
        .db-price-best-name { font-size:.83rem; color:#f5e6e8; text-decoration:none; display:block; }
        .db-price-best-name:hover { color:#c44569; }
        .db-price-best-val  { font-size:.75rem; color:#d4af37; margin-top:.1rem; }

        /* ── Maturity ── */
        .db-mat-list  { display:flex; flex-direction:column; }
        .db-mat-item  { display:flex; align-items:center; gap:.75rem; padding:.55rem 0; border-bottom:1px solid rgba(255,255,255,.03); text-decoration:none; }
        .db-mat-item:last-child { border-bottom:none; }
        .db-mat-year  { font-family:'Cormorant Garamond',serif; font-size:1.1rem; font-weight:600; color:#d4af37; width:2.4rem; flex-shrink:0; }
        .db-mat-info  { flex:1; min-width:0; }
        .db-mat-name  { font-size:.82rem; color:#f5e6e8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .db-mat-sub   { font-size:.68rem; color:rgba(245,230,232,.3); margin-top:.1rem; }
        .db-mat-badge { font-size:.62rem; padding:.18rem .5rem; border-radius:20px; white-space:nowrap; flex-shrink:0; }

        /* ── Country ── */
        .db-country-list     { display:flex; flex-direction:column; gap:.65rem; }
        .db-country-item     { display:flex; align-items:center; gap:.6rem; }
        .db-country-name     { font-size:.75rem; color:rgba(245,230,232,.5); width:80px; flex-shrink:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .db-country-bar-wrap { flex:1; height:4px; background:rgba(255,255,255,.05); border-radius:2px; overflow:hidden; }
        .db-country-bar      { height:100%; border-radius:2px; background:linear-gradient(to right,#8b1a2e,#c44569); }
        .db-country-num      { font-size:.72rem; color:rgba(245,230,232,.35); width:1.5rem; text-align:right; flex-shrink:0; }

        /* ── Recent grid ── */
        .db-recent-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }

        /* ── Empty state ── */
        .db-empty      { display:flex; flex-direction:column; align-items:center; padding:2rem 1rem; text-align:center; gap:.6rem; }
        .db-empty-icon { opacity:.2; }
        .db-empty-text { font-size:.78rem; color:rgba(245,230,232,.25); line-height:1.5; }

        /* ── Responsive ── */
        @media (max-width:1024px) {
          .db-kpis        { grid-template-columns:repeat(2,1fr); }
          .db-recent-grid { grid-template-columns:repeat(2,1fr); }
          .db-row-3       { grid-template-columns:1fr 1fr; }
        }
        @media (max-width:768px) {
          .db-page  { padding:1rem 1rem 3rem; }
          .db-row   { grid-template-columns:1fr; }
          .db-row-3 { grid-template-columns:1fr; }
          .db-recent-grid { grid-template-columns:repeat(2,1fr); }
        }
        @media (max-width:480px) {
          .db-kpis      { grid-template-columns:1fr 1fr; }
          .db-recent-grid { grid-template-columns:1fr; }
          .db-kpi-value { font-size:2.6rem; }
        }
      `}</style>

      <div className="db-page">
        <div className="db-inner">

          {/* ── Header ── */}
          <div className="db-header">
            <p className="db-eyebrow">Pivnița ta digitală</p>
            <CellarNameEditor initialName={cellarName} />
            <p className="db-sub">Statisticile colecției tale de vinuri</p>
          </div>
          <div className="db-divider" />

          {/* ── KPIs ── */}
          <div className="db-kpis">
            <KpiCard
              iconEl={<IconBottles color="#c44569" />}
              value={stats.totalBottles}
              label="Sticle totale"
              sub={`${inCellar} în pivniță`}
              accentColor="#c44569"
              iconBg="rgba(196,69,105,0.1)"
            />
            <KpiCard
              iconEl={<IconCellar color="#c9695a" />}
              value={stats.totalWines}
              label="Vinuri unice"
              sub={topType ? `Majoritar ${TYPE_LABELS[topType[0]]}` : null}
              accentColor="#c9695a"
              iconBg="rgba(201,105,90,0.12)"
            />
            <KpiCard
              iconEl={<IconValue color="#c9a84c" />}
              value={stats.totalValue > 0 ? `${Math.round(stats.totalValue)}€` : '—'}
              label="Valoare colecție"
              sub={advanced.priceStats.avg > 0 ? `Media ${Math.round(advanced.priceStats.avg)}€` : null}
              accentColor="#c9a84c"
              iconBg="rgba(201,168,76,0.1)"
            />
            <KpiCard
              iconEl={<IconGlobe color="#4a8fa8" />}
              value={Object.keys(advanced.byCountry).length}
              label="Țări reprezentate"
              sub={`${Object.keys(stats.byType).length} tipuri de vin`}
              accentColor="#4a8fa8"
              iconBg="rgba(74,143,168,0.1)"
            />
          </div>

          {/* ── URGENT: Vinuri depășite — trebuie băute ACUM ── */}
          {overdueWines.length > 0 && (
            <div className="db-urgent-card">
              <div className="db-urgent-glow" />
              <div className="db-urgent-title">
                <div className="db-urgent-title-icon">
                  <div className="db-urgent-pulse" />
                  <AlertTriangle size={13} strokeWidth={1.5} color="#ff6b4a" />
                  <span>Vinuri depășite — bea urgent!</span>
                </div>
                <span className="db-urgent-count">{overdueWines.length} {overdueWines.length === 1 ? 'vin' : 'vinuri'}</span>
              </div>
              <div className="db-urgent-list">
                {overdueWines.map(wine => {
                  const until = wine.drinkUntil ?? wine.readyYear;
                  const yearsOver = currentYear - until;
                  const overdueLabel = yearsOver <= 0
                    ? 'trecut de vârf'
                    : yearsOver === 1
                      ? 'trecut de vârf cu 1 an'
                      : `trecut de vârf cu ${yearsOver} ani`;
                  return (
                    <Link key={wine.id} href={`/wines/${wine.id}`} className="db-urgent-item">
                      <span className="db-urgent-year">{wine.drinkUntil ?? wine.readyYear ?? '—'}</span>
                      <div className="db-urgent-info">
                        <div className="db-urgent-name">{wine.name}</div>
                        <div className="db-urgent-sub">{wine.producer ?? wine.country ?? '—'}</div>
                      </div>
                      <span className="db-urgent-badge">{overdueLabel}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Row 1: Tip + Status ── */}
          <div className="db-row">
            <div className="db-card">
              <CardTitle href="/wines">Distribuție după tip</CardTitle>
              {Object.keys(stats.byType).length === 0 ? (
                <Empty icon={Wine} text="Nicio dată" />
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
                          <div className="db-bar-fill" style={{
                            width: `${Math.round((count / max) * 100)}%`,
                            background: TYPE_COLORS[type] ?? '#c44569'
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="db-card">
              <CardTitle>Status colecție</CardTitle>
              {Object.keys(stats.byStatus).length === 0 ? (
                <Empty icon={BarChart2} text="Nicio dată" />
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

          {/* ── Row 2: Monthly + Țări ── */}
          <div className="db-row">
            <div className="db-card">
              <CardTitle>Achiziții lunare — ultimele 12 luni</CardTitle>
              {advanced.monthlyData.every(m => m.count === 0) ? (
                <Empty icon={TrendingUp} text="Nicio achiziție înregistrată" />
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
              <CardTitle aside={`${Object.keys(advanced.byCountry).length} țări`}>Top țări</CardTitle>
              {topCountries.length === 0 ? (
                <Empty icon={Globe} text="Nicio dată" />
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

          {/* ── Row 3: Top vinuri + Prețuri + Maturitate ── */}
          <div className="db-row-3">
            {/* Top 5 */}
            <div className="db-card">
              <CardTitle>Top 5 vinuri</CardTitle>
              {advanced.topWines.length === 0 ? (
                <Empty icon={Star} text="Adaugă rating vinurilor" />
              ) : (
                <div className="db-top-list">
                  {advanced.topWines.map((wine, i) => (
                    <Link key={wine.id} href={`/wines/${wine.id}`} className="db-top-item">
                      <span className="db-top-rank">{i + 1}</span>
                      {wine.labelImageUrl || wine.bottleImageUrl ? (
                        <img src={wine.labelImageUrl || wine.bottleImageUrl} alt={wine.name} className="db-top-img" />
                      ) : (
                        <div className="db-top-img">
                          <Wine size={15} strokeWidth={1.5} color="rgba(196,69,105,0.45)" />
                        </div>
                      )}
                      <div className="db-top-info">
                        <div className="db-top-name">{wine.name}</div>
                        <div className="db-top-meta">
                          <Stars rating={wine.rating} />
                          <span style={{ marginLeft: '.3rem', color: 'rgba(245,230,232,.25)', fontSize: '.65rem' }}>
                            {STAR_LABELS[wine.rating]}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Statistici preț */}
            <div className="db-card">
              <CardTitle>Statistici preț</CardTitle>
              {advanced.priceStats.avg === 0 ? (
                <Empty icon={TrendingUp} text="Adaugă prețuri vinurilor" />
              ) : (
                <>
                  <div className="db-price-grid">
                    <div className="db-price-item">
                      <div className="db-price-val">{Math.round(advanced.priceStats.avg)}€</div>
                      <div className="db-price-lbl">Preț mediu</div>
                    </div>
                    <div className="db-price-item">
                      <div className="db-price-val">{Math.round(advanced.priceStats.max)}€</div>
                      <div className="db-price-lbl">Cel mai scump</div>
                    </div>
                    <div className="db-price-item">
                      <div className="db-price-val">{Math.round(advanced.priceStats.min)}€</div>
                      <div className="db-price-lbl">Cel mai ieftin</div>
                    </div>
                    <div className="db-price-item">
                      <div className="db-price-val">{Math.round(stats.totalValue)}€</div>
                      <div className="db-price-lbl">Valoare totală</div>
                    </div>
                  </div>
                  {advanced.priceStats.mostExpensive && (
                    <div className="db-price-best">
                      <div className="db-price-best-lbl">Cel mai scump vin</div>
                      <Link href={`/wines/${advanced.priceStats.mostExpensive.id}`} className="db-price-best-name">
                        {advanced.priceStats.mostExpensive.name}
                      </Link>
                      <div className="db-price-best-val">{advanced.priceStats.mostExpensive.purchasePrice}€</div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Maturitate — acum + aproape */}
            <div className="db-card">
              <CardTitle aside="3 ani">Aproape de maturitate</CardTitle>
              {nearMaturityWines.length === 0 && readyNowWines.length === 0 ? (
                <Empty icon={CalendarClock} text="Adaugă fereastra de consum la vinuri" />
              ) : (
                <div className="db-mat-list">
                  {/* Ready NOW */}
                  {readyNowWines.map(wine => (
                    <Link key={wine.id} href={`/wines/${wine.id}`} className="db-mat-item">
                      <span className="db-mat-year" style={{ color: '#55c44e' }}>{wine.readyYear}</span>
                      <div className="db-mat-info">
                        <div className="db-mat-name">{wine.name}</div>
                        <div className="db-mat-sub">{wine.producer ?? wine.country ?? '—'}</div>
                      </div>
                      <span className="db-mat-badge" style={{
                        background: 'rgba(85,196,78,.1)',
                        color: 'rgba(85,196,78,.9)',
                        border: '1px solid rgba(85,196,78,.2)',
                      }}>● Acum!</span>
                    </Link>
                  ))}
                  {/* Near maturity */}
                  {nearMaturityWines.map(wine => {
                    const yearsLeft = wine.readyYear - currentYear;
                    return (
                      <Link key={wine.id} href={`/wines/${wine.id}`} className="db-mat-item">
                        <span className="db-mat-year">{wine.readyYear}</span>
                        <div className="db-mat-info">
                          <div className="db-mat-name">{wine.name}</div>
                          <div className="db-mat-sub">{wine.producer ?? wine.country ?? '—'}</div>
                        </div>
                        <span className="db-mat-badge" style={{
                          background: 'rgba(212,175,55,.1)',
                          color: '#d4af37',
                          border: '1px solid rgba(212,175,55,.2)',
                        }}>{yearsLeft}a</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Vinuri recente ── */}
          <div className="db-card">
            <CardTitle href="/wines">Adăugate recent</CardTitle>
            {recentWines.length === 0 ? (
              <div className="db-empty">
                <div className="db-empty-icon"><Wine size={26} strokeWidth={1} color="rgba(245,230,232,0.2)" /></div>
                <p className="db-empty-text" style={{ marginBottom: '1rem' }}>
                  Colecția ta e goală. Adaugă primul vin!
                </p>
                <Link href="/wines/add" style={{
                  padding: '.5rem 1.25rem',
                  background: 'linear-gradient(135deg,#8b1a2e,#c44569)',
                  color: '#f5e6e8',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontSize: '.75rem',
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                }}>
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