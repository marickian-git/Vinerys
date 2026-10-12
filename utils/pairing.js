// HOME-003: „Ce gătesc cu el?” — 3 preparate, temperatura de servire și decantarea pentru un vin.
// Răspunsul se cache-uiește pe vin; cheia se schimbă doar când se schimbă identitatea vinului.
import { createHash } from 'node:crypto';

export function pairingKey(wine) {
  const identity = [wine.name, wine.producer, wine.vintage, wine.type, (wine.grapeVarieties ?? []).join('+'), wine.region, wine.country];
  return createHash('sha256').update(JSON.stringify(identity)).digest('hex').slice(0, 16);
}

export function pairingPrompt(wine, language = 'ro') {
  const facts = {
    name: wine.name, producer: wine.producer, vintage: wine.vintage, type: wine.type,
    grapes: wine.grapeVarieties, country: wine.country, region: wine.region,
    alcohol: wine.alcoholPercentage, aromas: wine.aromaProfile,
  };
  return `You are a sommelier. Suggest exactly 3 dishes that pair well with this wine, the ideal serving temperature and whether to decant.
Prefer dishes a home cook can make; include at least one Romanian or Eastern European dish when it genuinely fits.
Answer in ${language === 'ro' ? 'Romanian' : 'English'}. Return ONLY JSON with this shape:
{"dishes":[{"name":"","why":"one short sentence"}],"servingTemperature":{"min":16,"max":18},"decantMinutes":0,"glass":"","tip":"one short sentence"}
decantMinutes is 0 when decanting is not needed.
Wine: ${JSON.stringify(facts)}`;
}

const clampInt = (value, min, max) => {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : null;
};
const text = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

// Validează răspunsul AI; aruncă dacă nu are 3 preparate utilizabile
export function normalizePairing(raw) {
  const dishes = (Array.isArray(raw?.dishes) ? raw.dishes : [])
    .map((dish) => (typeof dish === 'string' ? { name: dish, why: '' } : dish))
    .map((dish) => ({ name: text(dish?.name, 80), why: text(dish?.why, 200) }))
    .filter((dish) => dish.name)
    .slice(0, 3);
  if (dishes.length < 3) throw Object.assign(new Error('Răspuns AI incomplet: mai puțin de 3 preparate'), { providerStatus: 'INVALID_RESULT' });
  let min = clampInt(raw?.servingTemperature?.min, 4, 22);
  let max = clampInt(raw?.servingTemperature?.max, 4, 22);
  if (min != null && max != null && min > max) [min, max] = [max, min];
  return {
    dishes,
    servingTemperature: min != null && max != null ? { min, max } : null,
    decantMinutes: clampInt(raw?.decantMinutes, 0, 240) ?? 0,
    glass: text(raw?.glass, 60) || null,
    tip: text(raw?.tip, 200) || null,
  };
}
