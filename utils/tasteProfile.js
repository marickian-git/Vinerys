// AI-011: profilul de gust, învățat din ratinguri, degustări, arome și vinurile consumate.
// Fără model ML: fiecare vin „votează” pentru trăsăturile lui (tip, soiuri, țară/regiune, categorii de arome),
// cu o pondere din cât de mult ți-a plăcut. Explicabil și stabil chiar cu puține date.
import { classifyAroma, foldKey } from './normalize';

const FEATURE_WEIGHTS = { type: 1, grape: 1.4, country: 0.8, region: 1, aroma: 0.7 };

// Cât de mult ți-a plăcut un vin: -1 (deloc) … +1 (foarte mult); null = nu știm
export function likeSignal(wine) {
  const ratings = [wine.rating, ...(wine.tastingRatings ?? [])].filter((r) => r != null);
  let signal = ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length - 3) / 2 : null;
  if (wine.isFavorite) signal = Math.max(signal ?? 0, 0.8);
  // Ai băut mai multe sticle → probabil îți place, dar mai slab decât un rating explicit
  if (signal == null && (wine.bottlesConsumed ?? 0) >= 2) signal = 0.3;
  return signal;
}

export function featuresOf(wine) {
  const features = [];
  if (wine.type) features.push(['type', wine.type]);
  for (const grape of wine.grapeVarieties ?? []) features.push(['grape', foldKey(grape)]);
  if (wine.country) features.push(['country', foldKey(wine.country)]);
  if (wine.region) features.push(['region', foldKey(wine.region)]);
  const categories = new Set([...(wine.aromaProfile ?? []), ...(wine.tastingAromas ?? [])].map((a) => classifyAroma(a)?.category).filter(Boolean));
  for (const category of categories) features.push(['aroma', category]);
  return features;
}

// Etichete lizibile pentru trăsături (păstrăm prima formă întâlnită, cu diacritice)
function labelFor(kind, wine, key) {
  if (kind === 'grape') return (wine.grapeVarieties ?? []).find((g) => foldKey(g) === key) ?? key;
  if (kind === 'country') return wine.country;
  if (kind === 'region') return wine.region;
  return key;
}

export function buildTasteProfile(wines) {
  const scores = new Map();
  let evidence = 0;
  for (const wine of wines) {
    const signal = likeSignal(wine);
    if (signal == null) continue;
    evidence += 1;
    for (const [kind, key] of featuresOf(wine)) {
      const id = `${kind}:${key}`;
      const entry = scores.get(id) ?? { kind, key, label: labelFor(kind, wine, key), score: 0, count: 0 };
      entry.score += signal * FEATURE_WEIGHTS[kind];
      entry.count += 1;
      scores.set(id, entry);
    }
  }
  const all = [...scores.values()].map((entry) => ({ ...entry, score: Number(entry.score.toFixed(3)) }));
  const top = (kind, n = 3) => all.filter((e) => e.kind === kind && e.score > 0).sort((a, b) => b.score - a.score).slice(0, n);
  const avoid = all.filter((e) => e.score < -0.5).sort((a, b) => a.score - b.score).slice(0, 3);
  return {
    evidence,
    confident: evidence >= 5,
    scores: Object.fromEntries(all.map((e) => [`${e.kind}:${e.key}`, e.score])),
    top: { type: top('type', 2), grape: top('grape'), country: top('country', 2), region: top('region'), aroma: top('aroma') },
    avoid,
  };
}

// Cât de probabil îți place un vin (0–1) + motivele principale
export function predictPreference(wine, profile) {
  const contributions = featuresOf(wine)
    .map(([kind, key]) => ({ kind, key, label: labelFor(kind, wine, key), score: profile.scores[`${kind}:${key}`] ?? 0 }))
    .filter((c) => c.score !== 0);
  const raw = contributions.reduce((sum, c) => sum + c.score, 0);
  const score = 1 / (1 + Math.exp(-raw / 2)); // 0.5 = neutru
  // Motivele specifice (soi, regiune, arome) explică mai bine decât tipul, care e comun multor vinuri
  const reasons = contributions
    .filter((c) => c.score > 0)
    .sort((a, b) => Number(a.kind === 'type') - Number(b.kind === 'type') || b.score - a.score)
    .slice(0, 2);
  return { score: Number(score.toFixed(3)), reasons };
}

// Vinuri asemănătoare: suprapunerea trăsăturilor (Jaccard ponderat)
export function similarWines(target, wines, limit = 3) {
  const weightOf = (features) => new Map(features.map(([kind, key]) => [`${kind}:${key}`, FEATURE_WEIGHTS[kind]]));
  const a = weightOf(featuresOf(target));
  return wines
    .filter((wine) => wine.id !== target.id)
    .map((wine) => {
      const b = weightOf(featuresOf(wine));
      let shared = 0;
      let union = 0;
      for (const key of new Set([...a.keys(), ...b.keys()])) {
        const weight = a.get(key) ?? b.get(key);
        union += weight;
        if (a.has(key) && b.has(key)) shared += weight;
      }
      return { wine, similarity: union ? shared / union : 0 };
    })
    .filter((item) => item.similarity >= 0.25)
    .sort((x, y) => y.similarity - x.similarity)
    .slice(0, limit);
}

export const AROMA_CATEGORY_LABELS = {
  RED_FRUIT: 'fructe roșii', BLACK_FRUIT: 'fructe negre', CITRUS: 'citrice', TREE_FRUIT: 'fructe albe', TROPICAL: 'fructe tropicale',
  DRIED_FRUIT: 'fructe uscate', FLORAL: 'flori', HERBAL: 'ierburi', SPICE: 'condimente', OAK: 'lemn și vanilie', EARTH: 'pământ și piele',
  MINERAL: 'mineral', SWEET: 'dulce și prăjit',
};
