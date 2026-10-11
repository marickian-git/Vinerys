// Calcule pure pentru statistici (DATA-006). Agregările grele se fac în DB (utils/actions.js);
// aici rămâne doar logica de fereastră de consum, care depinde de textul liber din agingPotential.

const yearsIn = (text) => (text?.match(/(\d{4})/g) ?? []).map(Number);

// Vinuri din pivniță trecute de fereastră, cele mai vechi primele
export function overdueWines(wines, currentYear) {
  return wines
    .filter((w) => {
      if (w.status !== 'IN_CELLAR') return false;
      if (w.drinkUntil != null) return w.drinkUntil < currentYear;
      const years = yearsIn(w.agingPotential);
      return years.length > 0 && Math.max(...years) < currentYear;
    })
    .map((w) => ({ ...w, drinkFrom: w.drinkFrom ?? null, drinkUntil: w.drinkUntil ?? null }))
    .sort((a, b) => (a.drinkUntil ?? 0) - (b.drinkUntil ?? 0));
}

// Vinuri în fereastră sau care intră în următorii 3 ani (primele 5, după anul în care sunt gata)
export function nearMaturityWines(wines, currentYear, limit = 5) {
  return wines
    .flatMap((w) => {
      if (w.status !== 'IN_CELLAR') return [];
      if (w.drinkFrom != null || w.drinkUntil != null) {
        const until = w.drinkUntil ?? w.drinkFrom;
        const from = w.drinkFrom ?? w.drinkUntil;
        return until >= currentYear && from <= currentYear + 3 ? [{ ...w, readyYear: from }] : [];
      }
      const years = yearsIn(w.agingPotential);
      if (!years.length) return [];
      const readyYear = Math.min(...years);
      return readyYear >= currentYear && readyYear <= currentYear + 3 ? [{ ...w, readyYear }] : [];
    })
    .sort((a, b) => a.readyYear - b.readyYear)
    .slice(0, limit);
}

// Ultimele 12 luni (inclusiv cea curentă), completate cu 0 unde DB-ul nu are rânduri.
// rows: [{ month: Date (prima zi a lunii, UTC), count }]
export function monthlySeries(rows, now = new Date()) {
  const counts = new Map(rows.map((row) => {
    const date = new Date(row.month);
    return [`${date.getUTCFullYear()}-${date.getUTCMonth()}`, Number(row.count)];
  }));
  const series = [];
  for (let i = 11; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    series.push({
      label: d.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' }),
      count: counts.get(`${d.getFullYear()}-${d.getMonth()}`) ?? 0,
    });
  }
  return series;
}

// groupBy Prisma → { cheie: număr }
export function countsBy(groups, field) {
  return Object.fromEntries(groups.filter((g) => g[field] != null).map((g) => [g[field], g._count._all]));
}
