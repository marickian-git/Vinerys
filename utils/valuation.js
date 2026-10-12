// CELLAR-008: valoare în timp și ROI. Funcții pure (sumele sunt deja convertite în aceeași monedă).
export function roi(purchasePrice, estimatedValue) {
  if (!purchasePrice || purchasePrice <= 0 || estimatedValue == null) return null;
  return (estimatedValue - purchasePrice) / purchasePrice;
}

export const formatRoi = (value) => (value == null ? '—' : `${value >= 0 ? '+' : ''}${Math.round(value * 100)}%`);

// Portofoliul (vinurile din pivniță × sticle): cost, valoare, câștig, ROI și topul câștigurilor / pierderilor
export function portfolio(wines) {
  const rows = wines
    .filter((w) => w.status === 'IN_CELLAR' && (w.quantity ?? 0) > 0)
    .map((w) => ({
      ...w,
      cost: w.purchasePrice != null ? w.purchasePrice * w.quantity : null,
      value: w.estimatedValue != null ? w.estimatedValue * w.quantity : null,
      roi: roi(w.purchasePrice, w.estimatedValue),
    }));
  const both = rows.filter((r) => r.cost != null && r.value != null);
  const cost = both.reduce((sum, r) => sum + r.cost, 0);
  const value = both.reduce((sum, r) => sum + r.value, 0);
  const ranked = both.filter((r) => r.roi != null).sort((a, b) => b.roi - a.roi);
  return {
    bottles: rows.reduce((sum, r) => sum + r.quantity, 0),
    totalValue: rows.reduce((sum, r) => sum + (r.value ?? 0), 0),
    cost,
    comparableValue: value,
    gain: value - cost,
    roi: cost > 0 ? (value - cost) / cost : null,
    gainers: ranked.filter((r) => r.roi > 0).slice(0, 5),
    losers: ranked.filter((r) => r.roi < 0).reverse().slice(0, 5),
    missing: rows.filter((r) => r.cost == null || r.value == null).length,
    rows,
  };
}

// Puncte pentru sparkline (SVG path în cutia w×h), ordonate în timp
export function sparklinePath(points, width = 160, height = 40) {
  if (points.length < 2) return null;
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const times = points.map((p) => new Date(p.recordedAt).getTime());
  const t0 = Math.min(...times);
  const t1 = Math.max(...times);
  const x = (t) => (t1 === t0 ? 0 : ((t - t0) / (t1 - t0)) * width);
  const y = (v) => (max === min ? height / 2 : height - ((v - min) / (max - min)) * height);
  return points.map((p, i) => `${i ? 'L' : 'M'}${x(times[i]).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ');
}
