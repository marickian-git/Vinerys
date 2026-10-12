// AI-007: „Am luat 6 Fetească Neagră 2021 de la Davino cu 80 lei.” → câmpuri de vin.
// Parser euristic (merge fără AI); cu agenți AI, textul trece întâi prin model și euristica rămâne fallback.
import { parseWineType } from './csvImport';

const NUMBER_WORDS = {
  un: 1, una: 1, o: 1, unu: 1, doua: 2, două: 2, doi: 2, trei: 3, patru: 4, cinci: 5, sase: 6, șase: 6,
  sapte: 7, șapte: 7, opt: 8, noua: 9, nouă: 9, zece: 10, doisprezece: 12, douasprezece: 12, douăsprezece: 12,
};
const LEADING = /^(am\s+(luat|cumpărat|cumparat|primit)|adaugă|adauga|pune|bagă|baga)\s+/i;
const CURRENCY = [[/\b(lei|ron)\b/i, 'RON'], [/(€|\beur(o|i)?\b)/i, 'EUR'], [/(\$|\bdolari?\b|\busd\b)/i, 'USD']];

export function parseWineSpeech(input) {
  let text = ` ${input.trim().replace(/[.!]+$/, '')} `;
  const out = {};

  // Preț: „cu 80 lei”, „la 45,5 euro”, „80 de lei bucata”
  const price = text.match(/\b(?:cu|la|pe)\s+(\d+(?:[.,]\d+)?)\s*(?:de\s+)?(lei|ron|euro|eur|€|\$|dolari)\b(\s+(bucata|sticla|sticlă|una))?/i);
  if (price) {
    out.purchasePrice = Number(price[1].replace(',', '.'));
    out.currency = CURRENCY.find(([pattern]) => pattern.test(price[2]))?.[1] ?? 'RON';
    text = text.replace(price[0], ' ');
  }

  // Producător: „de la Davino”, „de la crama Recaș”
  const producer = text.match(/\bde\s+la\s+(?:[Cc]rama\s+|[Cc]ramele\s+|[Dd]omeniul\s+)?([A-ZĂÂÎȘȚ][\p{L}'-]*(?:\s+[A-ZĂÂÎȘȚ][\p{L}'-]*)*)/u);
  if (producer) {
    out.producer = producer[1].trim();
    text = text.replace(producer[0], ' ');
  }

  text = text.replace(LEADING, ' ').replace(/^\s*(am\s+(luat|cumpărat|cumparat|primit))\s+/i, ' ');

  // Cantitate: cifră sau cuvânt, urmată opțional de „sticle”
  const quantity = text.match(/^\s*(\d{1,3}|[a-zăâîșț]+)\s+(?:(?:sticle|sticla|sticlă|bucăți|bucati)\s+(?:de\s+)?)?/i);
  if (quantity) {
    const value = /^\d+$/.test(quantity[1]) ? Number(quantity[1]) : NUMBER_WORDS[quantity[1].toLocaleLowerCase('ro-RO')];
    if (value && value < 1000) {
      out.quantity = value;
      text = text.replace(quantity[0], ' ');
    }
  }

  // An: 4 cifre plauzibile
  const vintage = text.match(/\b(19[5-9]\d|20[0-4]\d)\b/);
  if (vintage) {
    out.vintage = Number(vintage[1]);
    text = text.replace(vintage[0], ' ');
  }

  const name = text.replace(/\s+/g, ' ').replace(/^(de|din)\s+/i, '').trim();
  if (name) out.name = name.charAt(0).toLocaleUpperCase('ro-RO') + name.slice(1);
  out.type = parseWineType(input) ?? guessTypeFromGrape(name) ?? 'RED';
  return out;
}

// Soiuri românești și internaționale frecvente → tip (când textul nu spune explicit)
const WHITE_GRAPES = /(sauvignon blanc|chardonnay|riesling|fetească (albă|regală)|feteasca (alba|regala)|tămâioasă|tamaioasa|grasă|grasa|muscat|pinot gri|aligot)/i;
const ROSE_HINT = /(rose|rosé|roze)/i;
function guessTypeFromGrape(name) {
  if (ROSE_HINT.test(name)) return 'ROSE';
  if (WHITE_GRAPES.test(name)) return 'WHITE';
  return null;
}

export function voicePrompt(text) {
  return `Extract a wine purchase from this sentence (Romanian or English): ${JSON.stringify(text)}.
Return ONLY JSON: {"name":"","producer":null,"vintage":null,"quantity":1,"purchasePrice":null,"currency":"RON|EUR|USD","type":"RED|WHITE|ROSE|SPARKLING|DESSERT|FORTIFIED","grapeVarieties":[]}
"name" is the wine name without producer, quantity or price. Use null when unknown.`;
}

const TYPES = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED'];
const CURRENCIES = ['RON', 'EUR', 'USD'];

// Răspunsul AI validat și completat cu euristica (AI-ul poate omite câmpuri pe care regulile le prind)
export function mergeVoiceResult(raw, fallback = {}) {
  const pick = (value, ok) => (ok(value) ? value : undefined);
  const ai = raw && typeof raw === 'object' ? raw : {};
  const name = pick(ai.name?.toString().trim(), (v) => v && v.length <= 200);
  const result = {
    name: name ?? fallback.name,
    producer: pick(ai.producer?.toString().trim(), (v) => v && v.length <= 200) ?? fallback.producer,
    vintage: pick(Number(ai.vintage), (v) => Number.isInteger(v) && v >= 1800 && v <= 2100) ?? fallback.vintage,
    quantity: pick(Number(ai.quantity), (v) => Number.isInteger(v) && v >= 1 && v < 1000) ?? fallback.quantity ?? 1,
    purchasePrice: pick(Number(ai.purchasePrice), (v) => ai.purchasePrice != null && Number.isFinite(v) && v >= 0) ?? fallback.purchasePrice,
    currency: pick(ai.currency, (v) => CURRENCIES.includes(v)) ?? fallback.currency,
    type: pick(ai.type, (v) => TYPES.includes(v)) ?? fallback.type ?? 'RED',
    grapeVarieties: Array.isArray(ai.grapeVarieties) ? ai.grapeVarieties.map(String).map((g) => g.trim()).filter(Boolean).slice(0, 10) : [],
  };
  if (!result.name) throw new Error('Răspuns AI fără numele vinului');
  return Object.fromEntries(Object.entries(result).filter(([, v]) => v !== undefined));
}
