// DATA-007 / I18N-003: monede. Prețul unui vin se păstrează în moneda originală (Wine.currency);
// statisticile se convertesc în moneda preferată a utilizatorului (User.currency) cu cursurile BCE.
export const CURRENCIES = ['EUR', 'RON', 'USD', 'GBP', 'CHF', 'HUF', 'BGN'];
export const DEFAULT_CURRENCY = 'EUR';

export const isCurrency = (value) => CURRENCIES.includes(value);

// rates: { EUR: 1, RON: 4.97, … } (unități pe 1 EUR, ca în fluxul BCE). null dacă lipsește o monedă.
export function convert(amount, from, to, rates) {
  if (amount == null || !Number.isFinite(Number(amount))) return null;
  if (from === to) return Number(amount);
  const fromRate = from === 'EUR' ? 1 : rates?.[from];
  const toRate = to === 'EUR' ? 1 : rates?.[to];
  if (!fromRate || !toRate) return null;
  return (Number(amount) / fromRate) * toRate;
}

export function formatMoney(amount, currency = DEFAULT_CURRENCY, { locale = 'ro-RO', decimals } = {}) {
  if (amount == null || !Number.isFinite(Number(amount))) return '—';
  const value = Number(amount);
  const digits = decimals ?? (Number.isInteger(value) || Math.abs(value) >= 100 ? 0 : 2);
  // narrowSymbol: „€”, „lei”, „$” în loc de „EUR”, „RON”, „USD” (CLDR ro afișează codul)
  return new Intl.NumberFormat(locale, { style: 'currency', currency, currencyDisplay: 'narrowSymbol', minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

// Fluxul zilnic BCE (eurofxref-daily.xml) → { EUR: 1, USD: …, RON: … }
export function parseEcbXml(xml) {
  const rates = { EUR: 1 };
  for (const match of xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([\d.]+)['"]/g)) rates[match[1]] = Number(match[2]);
  return Object.keys(rates).length > 1 ? rates : null;
}

// Suma unor valori în monede diferite, convertită; ce nu se poate converti rămâne separat
export function sumInCurrency(parts, target, rates) {
  let total = 0;
  const unconverted = {};
  for (const { currency, amount } of parts) {
    const value = convert(amount, currency || DEFAULT_CURRENCY, target, rates);
    if (value == null) unconverted[currency] = (unconverted[currency] ?? 0) + Number(amount);
    else total += value;
  }
  return { total, unconverted };
}
