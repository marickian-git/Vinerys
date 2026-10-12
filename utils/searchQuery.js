// CELLAR-009: interogări în limbaj natural în bara de căutare din Pivniță.
// „Roșii gata de băut sub 150 lei” → { type: RED, readyNow: true, priceMax: 150, text: '' }.
// Ce nu e recunoscut rămâne text pentru căutarea fuzzy (nume, producător, regiune, soiuri, arome, note).
import { foldKey } from './normalize';

const TYPE_WORDS = [
  [/\b(rosii|rosu|red|reds)\b/, 'RED'],
  [/\b(albe|alb|white|whites)\b/, 'WHITE'],
  [/\b(roze|rose|rosé|rozé)\b/, 'ROSE'],
  [/\b(spumante|spumant|sparkling|bule)\b/, 'SPARKLING'],
  [/\b(desert|dulci|dessert)\b/, 'DESSERT'],
  [/\b(fortifiate|fortifiat|porto)\b/, 'FORTIFIED'],
];

const RULES = [
  // „gata de băut”, „la vârf”, „de băut acum”, „ready to drink”
  [/\b(gata de baut|de baut acum|la varf|in fereastra|ready to drink)\b/, (q) => { q.readyNow = true; }],
  [/\b(trecute de varf|trecut de varf|trecute|depasite|past peak)\b/, (q) => { q.overdue = true; }],
  [/\b(favorite|favoritele)\b/, (q) => { q.isFavorite = true; }],
  [/\b(?:sub|pana in|maxim|under|<)\s*(\d+(?:[.,]\d+)?)\s*(?:lei|ron|eur|euro|€)?/, (q, m) => { q.priceMax = Number(m[1].replace(',', '.')); }],
  [/\b(?:peste|minim|over|>)\s*(\d+(?:[.,]\d+)?)\s*(?:lei|ron|eur|euro|€)?/, (q, m) => { q.priceMin = Number(m[1].replace(',', '.')); }],
  [/\b(?:din|an|vintage)?\s*((?:19|20)\d{2})\b/, (q, m) => { q.vintage = Number(m[1]); }],
];

// Cuvinte de legătură care nu ajută căutarea fuzzy
const STOPWORDS = new Set(['vin', 'vinuri', 'de', 'cu', 'si', 'din', 'la', 'pentru', 'care', 'ceva', 'un', 'o', 'imi', 'arata']);

export function parseSearchQuery(input) {
  const query = {};
  let rest = ` ${foldKey(input)} `;
  for (const [pattern, type] of TYPE_WORDS) {
    if (!query.type && pattern.test(rest)) {
      query.type = type;
      rest = rest.replace(pattern, ' ');
    }
  }
  for (const [pattern, apply] of RULES) {
    const match = rest.match(pattern);
    if (match) {
      apply(query, match);
      rest = rest.replace(match[0], ' ');
    }
  }
  query.text = rest.split(/\s+/).filter((word) => word && !STOPWORDS.has(word)).join(' ');
  return query;
}

// Escape pentru ILIKE
export const likePattern = (text) => `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
