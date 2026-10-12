// CELLAR-006: planificatorul de consum. Împarte sticlele din pivniță pe anii ferestrei de consum,
// ca nimic să nu treacă de vârf. Vinurile depășite intră toate în anul curent, marcate.
const yearsIn = (text) => (text?.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);

// Fereastra unui vin: drinkFrom/drinkUntil sau, ca fallback, anii din agingPotential (text liber)
export function drinkWindow(wine) {
  let from = wine.drinkFrom ?? null;
  let until = wine.drinkUntil ?? null;
  if (from == null && until == null) {
    const years = yearsIn(wine.agingPotential);
    if (!years.length) return null;
    [from, until] = [Math.min(...years), Math.max(...years)];
  }
  from ??= until;
  until ??= from;
  return from <= until ? { from, until } : { from: until, until: from };
}

// Anii în care se deschid cele `count` sticle, răspândiți uniform în [start, end]
export function spreadBottles(count, start, end) {
  const span = end - start + 1;
  if (count <= 0) return [];
  if (count >= span) return Array.from({ length: count }, (_, i) => start + (i % span)).sort((a, b) => a - b);
  return Array.from({ length: count }, (_, i) => start + Math.floor(((i + 0.5) * span) / count));
}

export function buildPlan(wines, { currentYear = new Date().getFullYear(), horizon = 10 } = {}) {
  const lastYear = currentYear + horizon - 1;
  const years = new Map(Array.from({ length: horizon }, (_, i) => [currentYear + i, []]));
  const later = [];
  const unknown = [];
  const add = (year, entry) => {
    if (years.has(year)) {
      const list = years.get(year);
      const existing = list.find((item) => item.wineId === entry.wineId);
      if (existing) existing.bottles += 1;
      else list.push({ ...entry, bottles: 1 });
    } else later.push({ ...entry, year });
  };

  for (const wine of wines) {
    if (wine.status && wine.status !== 'IN_CELLAR') continue;
    const quantity = wine.quantity ?? 0;
    if (quantity <= 0) continue;
    const window = drinkWindow(wine);
    const base = { wineId: wine.id, name: wine.name, producer: wine.producer ?? null, vintage: wine.vintage ?? null, type: wine.type };
    if (!window) {
      unknown.push({ ...base, bottles: quantity });
      continue;
    }
    if (window.until < currentYear) {
      for (let i = 0; i < quantity; i += 1) add(currentYear, { ...base, status: 'overdue', window });
      continue;
    }
    const start = Math.max(currentYear, window.from);
    for (const year of spreadBottles(quantity, start, window.until)) {
      add(year, { ...base, status: year === window.until ? 'ending' : 'peak', window });
    }
  }

  const rank = { overdue: 0, ending: 1, peak: 2 };
  const plan = [...years.entries()].map(([year, list]) => ({
    year,
    bottles: list.reduce((sum, item) => sum + item.bottles, 0),
    wines: list.sort((a, b) => rank[a.status] - rank[b.status] || a.name.localeCompare(b.name, 'ro')),
  }));
  return {
    years: plan,
    later: later.length ? { from: lastYear + 1, bottles: later.length } : null,
    unknown,
    overdue: plan[0]?.wines.filter((item) => item.status === 'overdue').reduce((sum, item) => sum + item.bottles, 0) ?? 0,
  };
}
