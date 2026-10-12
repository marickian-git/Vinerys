// INT-003 „Cumpără din nou”: după ultima sticlă dintr-un vin care ți-a plăcut, propunem recumpărarea.
// Issue-ul cere rating ≥ 5; îl extindem la rating ≥ 4 sau favorit (scara e 1–5, iar 5 e rar folosit).
export const REORDER_MIN_RATING = 4;

export function shouldSuggestReorder(wine) {
  if (!wine || wine.quantity > 0) return false;
  if (!['CONSUMED', 'IN_CELLAR'].includes(wine.status)) return false;
  return Boolean(wine.isFavorite) || (wine.rating ?? 0) >= REORDER_MIN_RATING;
}

// Căutări gata făcute; nu avem parteneri, deci doar linkuri de căutare (afilierea vine cu BIZ, #66 → 5.4)
export function reorderLinks(wine) {
  const query = [wine.producer, wine.name, wine.vintage].filter(Boolean).join(' ');
  const q = encodeURIComponent(query);
  return [
    { label: 'Vivino', url: `https://www.vivino.com/search/wines?q=${q}` },
    { label: 'Google Shopping', url: `https://www.google.com/search?tbm=shop&q=${q}` },
    { label: 'Caută pe web', url: `https://www.google.com/search?q=${encodeURIComponent(`${query} vin pret`)}` },
  ];
}
