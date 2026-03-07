import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';

const TYPE_LABELS   = { RED: 'Roșu', WHITE: 'Alb', ROSE: 'Roze', SPARKLING: 'Spumant', DESSERT: 'Desert', FORTIFIED: 'Fortifiat' };
const STATUS_LABELS = { IN_CELLAR: 'În pivniță', CONSUMED: 'Consumat', SOLD: 'Vândut', GIFTED: 'Dăruit' };

async function getUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  return session.user;
}

function buildWhere(user, params) {
  const where = { userId: user.id };
  const filter = params.get('filter');
  const status = params.get('status');

  if (filter === 'favorites') where.isFavorite = true;
  if (filter === 'status' && status) where.status = status;
  // 'all' and 'current' both export all (current filters not passed for simplicity)
  return where;
}

// ── CSV ────────────────────────────────────────────────────────────────────

function toCSV(wines) {
  const cols = [
    'Nume', 'Producător', 'Țară', 'Regiune', 'Tip', 'Culoare', 'An recoltă',
    'Soiuri struguri', 'Alcool %', 'Cantitate', 'Locație pivniță',
    'Data achiziție', 'Preț achiziție (€)', 'Valoare estimată (€)',
    'Rating (1-5)', 'Note degustare', 'Temperatura servire', 'Asocieri gastronomice',
    'Potențial îmbătrânire', 'Dimensiune sticlă', 'Status', 'Favorit', 'Adăugat la',
  ];

  const escape = (v) => {
    if (v == null) return '';
    const s = String(v).replace(/"/g, '""');
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s}"` : s;
  };

  const rows = wines.map(w => [
    w.name, w.producer, w.country, w.region,
    TYPE_LABELS[w.type] ?? w.type,
    w.color ?? '',
    w.vintage ?? '',
    (w.grapeVarieties ?? []).join('; '),
    w.alcoholPercentage ?? '',
    w.quantity ?? 1,
    w.cellarLocation ?? '',
    w.purchaseDate ? new Date(w.purchaseDate).toLocaleDateString('ro-RO') : '',
    w.purchasePrice ?? '',
    w.estimatedValue ?? '',
    w.rating ?? '',
    w.tastingNotes ?? '',
    w.servingTemperature ?? '',
    (w.foodPairing ?? []).join('; '),
    w.agingPotential ?? '',
    w.bottleSize ?? '',
    STATUS_LABELS[w.status] ?? w.status,
    w.isFavorite ? 'Da' : 'Nu',
    new Date(w.createdAt).toLocaleDateString('ro-RO'),
  ].map(escape).join(','));

  return '\uFEFF' + [cols.join(','), ...rows].join('\n');
}

// ── PDF (HTML → print) ─────────────────────────────────────────────────────

function toPDFHTML(wines, userName) {
  const date = new Date().toLocaleDateString('ro-RO', { year: 'numeric', month: 'long', day: 'numeric' });

  const rows = wines.map((w, i) => `
    <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
      <td class="num">${i + 1}</td>
      <td><strong>${w.name}</strong>${w.producer ? `<br><span class="sub">${w.producer}</span>` : ''}</td>
      <td>${w.vintage ?? '—'}</td>
      <td>${TYPE_LABELS[w.type] ?? w.type}</td>
      <td>${w.country ?? '—'}${w.region ? `<br><span class="sub">${w.region}</span>` : ''}</td>
      <td class="center">${w.quantity ?? 1}</td>
      <td class="center">${w.rating ? '★'.repeat(w.rating) + '☆'.repeat(5 - w.rating) : '—'}</td>
      <td class="right">${w.purchasePrice ? w.purchasePrice + ' €' : '—'}</td>
      <td>${STATUS_LABELS[w.status] ?? w.status}</td>
    </tr>
  `).join('');

  const totalValue = wines.reduce((s, w) => s + (w.estimatedValue || w.purchasePrice || 0), 0);
  const totalBottles = wines.reduce((s, w) => s + (w.quantity || 1), 0);

  return `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8">
<title>Colecție Vinerys — ${userName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;600&family=Jost:wght@300;400;500&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Jost', sans-serif; background: #fff; color: #1a0a0d; font-size: 11px; }
  
  .cover { padding: 60px 50px 40px; border-bottom: 2px solid #8b1a2e; margin-bottom: 30px; }
  .cover-eyebrow { font-size: 9px; text-transform: uppercase; letter-spacing: 0.25em; color: #c44569; margin-bottom: 8px; }
  .cover-title { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; color: #1a0a0d; line-height: 1; margin-bottom: 6px; }
  .cover-sub { font-size: 11px; color: #666; font-weight: 300; }
  .cover-meta { margin-top: 16px; display: flex; gap: 30px; }
  .cover-stat { }
  .cover-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #8b1a2e; }
  .cover-stat-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #999; }

  .content { padding: 0 50px 50px; }
  
  table { width: 100%; border-collapse: collapse; }
  thead tr { background: #8b1a2e; }
  thead th { color: #fff; font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.12em; padding: 8px 6px; text-align: left; font-weight: 500; }
  thead th.center { text-align: center; }
  thead th.right { text-align: right; }
  
  tbody tr.even { background: #fff; }
  tbody tr.odd  { background: #fdf5f6; }
  tbody tr:hover { background: #fce8ec; }
  
  td { padding: 7px 6px; border-bottom: 1px solid #f0e0e3; vertical-align: top; line-height: 1.4; }
  td.num { color: #c44569; font-size: 9px; text-align: center; width: 24px; }
  td.center { text-align: center; color: #8b1a2e; }
  td.right { text-align: right; }
  .sub { font-size: 9px; color: #999; font-weight: 300; }
  
  .footer { margin-top: 30px; padding-top: 12px; border-top: 1px solid #f0e0e3; display: flex; justify-content: space-between; font-size: 9px; color: #bbb; }
  
  @media print {
    @page { margin: 15mm 12mm; size: A4 landscape; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="cover">
    <p class="cover-eyebrow">Vinerys · Raport colecție</p>
    <h1 class="cover-title">Colecția lui ${userName}</h1>
    <p class="cover-sub">Generat la ${date}</p>
    <div class="cover-meta">
      <div class="cover-stat">
        <div class="cover-stat-val">${wines.length}</div>
        <div class="cover-stat-label">Vinuri unice</div>
      </div>
      <div class="cover-stat">
        <div class="cover-stat-val">${totalBottles}</div>
        <div class="cover-stat-label">Sticle totale</div>
      </div>
      ${totalValue > 0 ? `<div class="cover-stat">
        <div class="cover-stat-val">${Math.round(totalValue)} €</div>
        <div class="cover-stat-label">Valoare estimată</div>
      </div>` : ''}
    </div>
  </div>

  <div class="content">
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Vin / Producător</th>
          <th>An</th>
          <th>Tip</th>
          <th>Origine</th>
          <th class="center">Buc.</th>
          <th class="center">Rating</th>
          <th class="right">Preț</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="footer">
      <span>Vinerys · pivnița ta digitală</span>
      <span>${wines.length} vinuri · ${totalBottles} sticle</span>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
}

// ── Handler ────────────────────────────────────────────────────────────────

export async function GET(request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') ?? 'csv'; // csv | pdf
  const where  = buildWhere(user, searchParams);

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, cellarName: true },
  });

  const wines = await prisma.wine.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  if (format === 'csv') {
    const csv = toCSV(wines);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vinerys-colectie-${new Date().toISOString().slice(0,10)}.csv"`,
      },
    });
  }

  if (format === 'pdf') {
    const html = toPDFHTML(wines, profile?.cellarName || profile?.name || 'Colecție');
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  return NextResponse.json({ error: 'Format invalid' }, { status: 400 });
}