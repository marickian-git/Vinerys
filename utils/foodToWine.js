// HOME-004 „Ce gătesc azi?”: preparat → top 3 sticle din pivniță. Scor = potrivire × urgență (+ puțin gust personal).
// Potrivirea vine de la AI când există agenți; altfel din asocierile salvate pe fiecare vin (foodPairing, completat la scanare).
import { drinkWindow } from './planner';
import { foldKey } from './normalize';

// 0 (poate aștepta) … 1 (de băut acum): trecut de vârf > ultimul an > spre finalul ferestrei > abia intrat > încă tânăr
export function urgencyScore(wine, year = new Date().getFullYear()) {
  // 1. Scor de bază pe baza ferestrei de consum (cu fallback la agingPotential)
  let window;
  if (wine.drinkFrom == null && wine.drinkUntil == null && wine.drinkLimit != null) {
    // Fallback to drinkLimit when both drinkFrom and drinkMissing
    const yearsIn = (text) => (text?.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);
    const years = yearsIn(wine.drinkLimit);
    if (years.length) {
      const from = Math.min(...years);
      const until = Math.max(...years);
      window = { from, until };
    } else {
      window = null;
    }
  } else {
    // Use drinkWindow but possibly override drinkLimit if missing
    const effectiveWine = { ...wine };
    if (effectiveWine.drinkUntil == null && effectiveWine.drinkLimit != null) {
      effectiveWine.drinkUntil = effectiveWine.drinkLimit;
    }
    window = drinkWindow(effectiveWine);
  }

  let baseUrgency;
  if (!window) {
    // Fereastră necunoscută → scor implicit 0.4 (acesteași ca în Implementarea curentă)
    baseUrgency = 0.4;
  } else {
    const currentYear = year;
    if (window.until < currentYear) {
      // Trecut de vârf
      baseUrgency = 1;
    } else if (window.until === currentYear) {
      // În anul curent
      baseUrgency = 0.9;
    } else if (window.from > currentYear) {
      // Tânăr
      baseUrgency = 0.15;
    } else {
      // În fereastră de consum
      const span = Math.max(1, window.until - window.from);
      baseUrgency = Number((0.45 + 0.4 * ((currentYear - window.from) / span)).toFixed(3));
    }
  }

  // 2. Ponderare cu cantitatea și valoarea (normalizată la valori neutre)
  // Valoarea neutră pentru cantitate: 1 sticlă (factor 0.05); pentru valoare: 2500 (unități de monetă, factor 0.5)
  // Cantitatea și valoarea implicite în tests/singure sunt 20 și 5000 (factor 1)
  const quantityDefault = 20;
  const quantityNeutral = 1;
  const valueDefault = 5000;
  const valueNeutral = 2500;

  const qty = wine.quantity == null ? quantityNeutral : wine.quantity;
  const val = wine.estimatedValue == null ? valueNeutral : wine.estimatedValue;

  const quantityFactor = Math.min(qty / quantityDefault, 1);
  const valueFactor = Math.min(val / valueDefault, 1);

  // Scor final = bază * factorCantitate * factorValoare
  return Number((baseUrgency * quantityFactor * valueFactor).toFixed(3));
}

const STOP = new Set(['cu', 'si', 'și', 'de', 'la', 'in', 'în', 'pe', 'sau', 'din', 'a', 'al', 'ale', 'un', 'o']);
const words = (text) => foldKey(text).split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));

// Potrivire fără AI: cuvintele preparatului regăsite în asocierile vinului (cu rădăcină comună: „miel” ~ „mielul”)
export function heuristicMatch(dish, wine) {
  const dishWords = words(dish);
  if (!dishWords.length) return { match: 0, reason: null };
  const pairings = (wine.foodPairing ?? []).map((p) => ({ text: p, words: words(p) }));
  let best = { match: 0, reason: null };
  for (const pairing of pairings) {
    const hits = dishWords.filter((w) => pairing.words.some((pw) => pw.startsWith(w.slice(0, 5)) || w.startsWith(pw.slice(0, 5))));
    const match = hits.length / dishWords.length;
    if (match > best.match) best = { match, reason: `Se potrivește cu „${pairing.text}”` };
  }
  return best;
}

export function pairingCandidates(wines) {
  return wines
    .filter((w) => w.status === 'IN_CELLAR' && (w.quantity ?? 0) > 0)
    .map((w) => ({
      id: w.id, name: w.name, producer: w.producer, vintage: w.vintage, type: w.type, grapes: w.grapeVarieties,
      region: w.region, country: w.country, foodPairing: w.foodPairing, aromas: w.aromaProfile,
    }));
}

export function foodToWinePrompt(dish, candidates, language = 'ro') {
  return `You are a sommelier choosing from the user's OWN cellar. Dish: ${JSON.stringify(dish)}.
Pick up to 3 wines that pair best, using ONLY ids from the list below. Rate each pairing "match" from 0 to 1 (1 = classic pairing).
Write "reason" as one short sentence in ${language === 'ro' ? 'Romanian' : 'English'}. Return ONLY JSON: {"picks":[{"id":"","match":0.0,"reason":""}]}
Cellar: ${JSON.stringify(candidates.slice(0, 80))}`;
}

// Validează răspunsul AI: doar id-uri existente în pivniță (nu inventăm vinuri), potriviri între 0 și 1
export function normalizeFoodPicks(raw, candidateIds) {
  const ids = new Set(candidateIds);
  const picks = (Array.isArray(raw?.picks) ? raw.picks : [])
    .filter((p) => ids.has(p?.id))
    .map((p) => ({ id: p.id, match: Math.max(0, Math.min(1, Number(p.match) || 0)), reason: typeof p.reason === 'string' ? p.reason.trim().slice(0, 200) : '' }))
    .filter((p, index, all) => all.findIndex((x) => x.id === p.id) === index);
  if (!picks.length) throw Object.assign(new Error('Răspuns AI fără vinuri din pivniță'), { providerStatus: 'INVALID_RESULT' });
  return { picks };
}

// Clasamentul final: potrivire × (0.6 + 0.4 × urgență) × (0.9 + 0.2 × gust), top 3
export function rankPicks(picks, wines, { taste = () => 0.5, year } = {}) {
  const byId = new Map(wines.map((w) => [w.id, w]));
  return picks
    .filter((p) => p.match > 0 && byId.has(p.id))
    .map((p) => {
      const wine = byId.get(p.id);
      const urgency = urgencyScore(wine, year);
      const score = p.match * (0.6 + 0.4 * urgency) * (0.9 + 0.2 * taste(wine));
      return { wine, match: p.match, urgency, score: Number(score.toFixed(3)), reason: p.reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

// AI-003: poza farfuriei → numele felului de mâncare (apoi același flux ca la text)
export function dishFromPhotoPrompt(language = 'ro') {
  return `Look at this photo. If it shows food or a dish, name it the way a waiter would, in ${language === 'ro' ? 'Romanian' : 'English'}, with the main ingredient and cooking method (e.g. "miel la cuptor cu rozmarin"). Return ONLY JSON: {"isFood":true,"dish":"","confidence":0.0}. If it is not food, return {"isFood":false,"dish":"","confidence":0}.`;
}

export function normalizeDish(raw) {
  if (raw?.isFood === false) throw Object.assign(new Error('Poza nu pare să arate mâncare'), { providerStatus: 'NOT_FOOD' });
  const dish = typeof raw?.dish === 'string' ? raw.dish.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  if (dish.length < 3) throw Object.assign(new Error('Răspuns AI fără fel de mâncare'), { providerStatus: 'INVALID_RESULT' });
  return { dish, confidence: Math.max(0, Math.min(1, Number(raw.confidence) || 0)) };
}