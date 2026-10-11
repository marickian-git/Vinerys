// Cost estimat per apel AI (AI-013). Prețurile se schimbă des, deci nu le scriem în cod:
// - agent.metadata.pricing = { input, output } în USD / 1M tokeni (setat per agent), sau
// - AI_PRICING_JSON = {"gemini-2.5-flash": [0.3, 2.5], "claude-": [3, 15]} (cheie = model exact sau prefix).
// Agenții pe tier gratuit costă 0. Fără preț cunoscut, costul rămâne null (tokenii se păstrează oricum).

let envPricing;
function pricingFromEnv() {
  if (envPricing !== undefined) return envPricing;
  try {
    envPricing = JSON.parse(process.env.AI_PRICING_JSON || '{}');
  } catch {
    envPricing = {};
  }
  return envPricing;
}

export function resetPricingCache() {
  envPricing = undefined;
}

export function priceFor({ model, pricing, billingType }) {
  if (billingType === 'FREE_TIER' || billingType === 'FREE') return { input: 0, output: 0 };
  if (pricing && Number.isFinite(Number(pricing.input)) && Number.isFinite(Number(pricing.output))) {
    return { input: Number(pricing.input), output: Number(pricing.output) };
  }
  if (!model) return null;
  const table = pricingFromEnv();
  const key = table[model] ? model : Object.keys(table).filter((prefix) => model.startsWith(prefix)).sort((a, b) => b.length - a.length)[0];
  const entry = key ? table[key] : null;
  return Array.isArray(entry) && entry.length === 2 ? { input: Number(entry[0]), output: Number(entry[1]) } : null;
}

export function estimateCostUsd(entry) {
  const price = priceFor(entry);
  if (!price || entry.inputTokens == null || entry.outputTokens == null) return null;
  return Number(((entry.inputTokens * price.input + entry.outputTokens * price.output) / 1_000_000).toFixed(6));
}
