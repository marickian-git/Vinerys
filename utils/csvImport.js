// Import CSV (INT-001 Vivino, INT-002 CellarTracker): parsare, mapare coloane, preview, duplicate.
// Funcții pure: rulează în browser (preview) și pe server (validare finală înainte de scriere).
import { foldKey } from './normalize';

// ── Parsare CSV (RFC 4180: ghilimele, virgule și newline-uri în câmpuri) ──
export function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
  const counts = [',', ';', '\t'].map((d) => [d, firstLine.split(d).length - 1]);
  return counts.sort((a, b) => b[1] - a[1])[0][1] > 0 ? counts[0][0] : ',';
}

export function parseCsv(text, delimiter = detectDelimiter(text)) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const input = text.replace(/^﻿/, '');
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (quoted) {
      if (char === '"' && input[i + 1] === '"') { field += '"'; i += 1; }
      else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"' && field === '') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field); field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((cell) => cell.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  row.push(field);
  if (row.some((cell) => cell.trim() !== '')) rows.push(row);
  const [header = [], ...data] = rows;
  const headers = header.map((h) => h.trim());
  return { headers, rows: data.map((cells) => Object.fromEntries(headers.map((h, index) => [h, (cells[index] ?? '').trim()]))) };
}

// ── Câmpuri țintă și aliasuri de coloane per sursă ──
export const TARGET_FIELDS = [
  'name', 'producer', 'vintage', 'country', 'region', 'subregion', 'type', 'color', 'grapeVarieties',
  'quantity', 'bottleSize', 'purchasePrice', 'estimatedValue', 'purchaseDate', 'cellarLocation',
  'rating', 'tastingNotes', 'drinkFrom', 'drinkUntil',
];

export const SOURCES = {
  vivino: {
    label: 'Vivino',
    signature: ['winery', 'wine name'],
    columns: {
      name: ['wine name', 'wine'],
      producer: ['winery'],
      vintage: ['vintage'],
      country: ['country'],
      region: ['region'],
      type: ['wine type', 'type'],
      grapeVarieties: ['grapes', 'grape', 'regional wine style'],
      quantity: ['user cellar count', 'cellar count', 'quantity', 'bottles'],
      purchasePrice: ['wine price', 'price', 'your price'],
      purchaseDate: ['purchase date', 'scan date'],
      rating: ['your rating', 'rating'],
      tastingNotes: ['your review', 'personal note', 'review'],
      drinkFrom: ['drinking window from', 'drink from'],
      drinkUntil: ['drinking window to', 'drink until'],
    },
  },
  generic: {
    label: 'CSV generic',
    signature: [],
    columns: {
      name: ['name', 'nume', 'wine', 'vin'],
      producer: ['producer', 'producator', 'producător', 'winery', 'crama'],
      vintage: ['vintage', 'an', 'an recolta', 'an recoltă', 'year'],
      country: ['country', 'tara', 'țară'],
      region: ['region', 'regiune'],
      type: ['type', 'tip'],
      grapeVarieties: ['grapes', 'soiuri', 'soiuri struguri', 'varietal'],
      quantity: ['quantity', 'cantitate', 'bottles', 'sticle'],
      purchasePrice: ['price', 'pret', 'preț', 'pret achizitie (€)', 'preț achiziție (€)'],
      estimatedValue: ['value', 'valoare', 'valoare estimata (€)', 'valoare estimată (€)'],
      cellarLocation: ['location', 'locatie', 'locație', 'locatie pivnita', 'locație pivniță'],
      rating: ['rating', 'rating (1-5)'],
      tastingNotes: ['notes', 'note', 'note degustare'],
    },
  },
};

export function detectSource(headers) {
  const keys = new Set(headers.map(foldKey));
  for (const [id, source] of Object.entries(SOURCES)) {
    if (source.signature.length && source.signature.every((column) => keys.has(column))) return id;
  }
  return 'generic';
}

// { câmp țintă: coloana din CSV } pe baza aliasurilor sursei
export function autoMapColumns(headers, sourceId) {
  const byKey = new Map(headers.map((h) => [foldKey(h), h]));
  const mapping = {};
  for (const [field, aliases] of Object.entries(SOURCES[sourceId]?.columns ?? {})) {
    const match = aliases.map(foldKey).find((alias) => byKey.has(alias));
    if (match) mapping[field] = byKey.get(match);
  }
  return mapping;
}

// ── Conversii de valori ──
const TYPE_ALIASES = [
  [/spumant|sparkling|champagne|cava|prosecco|cremant|sekt|frizzante/, 'SPARKLING'],
  [/fortif|porto|port\b|sherry|madeira|marsala/, 'FORTIFIED'],
  [/desert|dessert|sweet|dulce|tokaji|sauternes|ice ?wine/, 'DESSERT'],
  [/rose|rosé|rosato|rosado|roze/, 'ROSE'],
  [/white|alb|blanc|bianco|blanco/, 'WHITE'],
  [/red|rosu|roșu|rouge|rosso|tinto/, 'RED'],
];

export function parseWineType(value) {
  const key = foldKey(value);
  if (!key) return null;
  return TYPE_ALIASES.find(([pattern]) => pattern.test(key))?.[1] ?? null;
}

export function parseNumber(value) {
  if (value == null || value === '') return null;
  const cleaned = value.toString().replace(/[^\d,.-]/g, '');
  // 1.234,56 (RO/EU) → 1234.56 ; 1,234.56 (US) → 1234.56 ; 12,5 → 12.5
  const normalized = /,\d{1,2}$/.test(cleaned) ? cleaned.replace(/\./g, '').replace(',', '.') : cleaned.replace(/,/g, '');
  const number = Number.parseFloat(normalized);
  return Number.isFinite(number) ? number : null;
}

function parseYear(value) {
  const year = Number.parseInt(value?.toString().match(/\d{4}/)?.[0] ?? '', 10);
  return year >= 1800 && year <= 2100 ? year : null;
}

function parseDate(value) {
  if (!value) return null;
  const ro = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  const date = ro ? new Date(Date.UTC(+ro[3], +ro[2] - 1, +ro[1])) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

// Ratinguri pe altă scară (Vivino 1–5 cu zecimale, CellarTracker 50–100) → 1–5 întreg
export function normalizeRating(value) {
  const number = parseNumber(value);
  if (number == null || number <= 0) return null;
  const scaled = number > 5 ? (Math.max(50, Math.min(100, number)) - 50) / 10 : number;
  return Math.max(1, Math.min(5, Math.round(scaled)));
}

function parseBottleSize(value) {
  const ml = parseNumber(value);
  if (!ml) return null;
  const liters = ml > 20 ? ml / 1000 : ml;
  return `${Number(liters.toFixed(3))}L`;
}

// Un rând CSV → intrare pentru WineInputSchema (sau { error })
export function mapRow(row, mapping) {
  const get = (field) => (mapping[field] ? row[mapping[field]] ?? '' : '');
  const name = get('name') || [get('producer'), get('vintage')].filter(Boolean).join(' ');
  if (!name.trim()) return { error: 'Lipsește numele vinului' };
  const type = parseWineType(get('type')) ?? parseWineType(get('color'));
  if (!type) return { error: `Tip necunoscut: „${get('type') || '—'}”` };
  const vintage = parseYear(get('vintage'));
  const quantity = parseNumber(get('quantity'));
  return {
    wine: {
      name: name.trim(),
      producer: get('producer') || undefined,
      vintage: vintage ?? undefined,
      country: get('country') || undefined,
      region: get('region') || undefined,
      subregion: get('subregion') || undefined,
      type,
      grapeVarieties: get('grapeVarieties') ? get('grapeVarieties').split(/[;,/]/).map((g) => g.trim()).filter(Boolean) : [],
      quantity: quantity != null ? Math.max(0, Math.round(quantity)) : 1,
      bottleSize: parseBottleSize(get('bottleSize')) ?? undefined,
      purchasePrice: parseNumber(get('purchasePrice')) ?? undefined,
      estimatedValue: parseNumber(get('estimatedValue')) ?? undefined,
      purchaseDate: parseDate(get('purchaseDate')) ?? undefined,
      cellarLocation: get('cellarLocation') || undefined,
      rating: normalizeRating(get('rating')) ?? undefined,
      tastingNotes: get('tastingNotes') || undefined,
      drinkFrom: parseYear(get('drinkFrom')),
      drinkUntil: parseYear(get('drinkUntil')),
    },
  };
}

// Cheia de duplicat: nume + producător + an, fără diacritice/majuscule
export function duplicateKey({ name, producer, vintage }) {
  return [foldKey(name), foldKey(producer), vintage ?? ''].join('|');
}

// Preview: fiecare rând cu vinul mapat, eroarea sau marcajul de duplicat (față de colecție sau în fișier)
export function buildPreview(rows, mapping, existingKeys = []) {
  const seen = new Set(existingKeys);
  return rows.map((row, index) => {
    const mapped = mapRow(row, mapping);
    if (mapped.error) return { index, status: 'error', error: mapped.error };
    const key = duplicateKey(mapped.wine);
    const status = seen.has(key) ? 'duplicate' : 'ok';
    seen.add(key);
    return { index, status, wine: mapped.wine };
  });
}
