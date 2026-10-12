// SOCIAL-001 „Vinerys Wrapped”: recapitularea unui an din istoricul de consum și din colecție. Funcție pură.
//
// consumptions: [{ quantity, at: Date, wine: { id, name, producer, country, type, grapeVarieties, rating, isFavorite, purchasePrice, estimatedValue } }]
// cellar:       vinurile IN_CELLAR la momentul calculului (pentru valoarea colecției)
const top = (counts, limit = 3) =>
  [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ro')).slice(0, limit).map(([name, count]) => ({ name, count }));

function tally(items, keyOf) {
  const counts = new Map();
  for (const item of items) {
    for (const key of [keyOf(item)].flat()) {
      if (key) counts.set(key, (counts.get(key) ?? 0) + (item.quantity ?? 1));
    }
  }
  return counts;
}

export function buildWrapped({ year, consumptions = [], cellar = [] }) {
  const inYear = consumptions.filter((c) => new Date(c.at).getFullYear() === year && c.wine);
  const bottles = inYear.reduce((sum, c) => sum + (c.quantity ?? 1), 0);
  const countries = tally(inYear, (c) => c.wine.country);
  const varieties = tally(inYear, (c) => c.wine.grapeVarieties ?? []);
  const producers = tally(inYear, (c) => c.wine.producer);
  const types = tally(inYear, (c) => c.wine.type);
  const months = Array.from({ length: 12 }, (_, month) =>
    inYear.filter((c) => new Date(c.at).getMonth() === month).reduce((sum, c) => sum + (c.quantity ?? 1), 0));

  const uniqueWines = [...new Map(inYear.map((c) => [c.wine.id, c.wine])).values()];
  const favorites = uniqueWines
    .filter((w) => w.isFavorite || (w.rating ?? 0) >= 4)
    .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || Number(b.isFavorite) - Number(a.isFavorite))
    .slice(0, 3);
  const priceOf = (w) => w.purchasePrice ?? w.estimatedValue ?? null;
  const mostExpensive = uniqueWines.filter((w) => priceOf(w) != null).sort((a, b) => priceOf(b) - priceOf(a))[0] ?? null;
  const collectionValue = cellar.reduce((sum, w) => sum + (w.estimatedValue ?? 0) * (w.quantity ?? 0), 0);
  const busiestMonth = bottles ? months.indexOf(Math.max(...months)) : null;

  return {
    year,
    bottles,
    wines: uniqueWines.length,
    countries: { count: countries.size, top: top(countries) },
    varieties: { count: varieties.size, top: top(varieties) },
    topProducer: top(producers, 1)[0] ?? null,
    topType: top(types, 1)[0] ?? null,
    favorites: favorites.map(({ id, name, producer, rating }) => ({ id, name, producer, rating })),
    mostExpensive: mostExpensive ? { id: mostExpensive.id, name: mostExpensive.name, price: priceOf(mostExpensive) } : null,
    months,
    busiestMonth,
    collection: { bottles: cellar.reduce((sum, w) => sum + (w.quantity ?? 0), 0), value: collectionValue },
  };
}

const MONTHS = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie', 'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
export const monthName = (index) => MONTHS[index] ?? '';

// Textul scurt pentru distribuire (Web Share / clipboard)
export function wrappedShareText(w) {
  const parts = [`🍷 ${w.year} în Vinerys: ${w.bottles} ${w.bottles === 1 ? 'sticlă' : 'sticle'} din ${w.countries.count} ${w.countries.count === 1 ? 'țară' : 'țări'}`];
  if (w.varieties.top[0]) parts.push(`soiul anului: ${w.varieties.top[0].name}`);
  if (w.topProducer) parts.push(`producătorul preferat: ${w.topProducer.name}`);
  return `${parts.join(' · ')}.`;
}
