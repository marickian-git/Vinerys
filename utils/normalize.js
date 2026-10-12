// Normalizare și vocabulare canonice (DATA-010).
// Funcții pure, folosite la salvare (schemas/wine.js), de scriptul de migrare și, pe viitor, de AI și roata de arome.

// Cheie de comparație: fără diacritice, litere mici, spații compactate ("Bucătărie " ≡ "bucatarie")
export function foldKey(value) {
  return (value ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ș|ş/gi, 's')
    .replace(/ț|ţ/gi, 't')
    .toLocaleLowerCase('ro-RO')
    .replace(/\s+/g, ' ')
    .trim();
}

// Trim + spații multiple; ș/ț cu sedilă → virgulă (forma corectă în română). Gol → null
export function cleanText(value) {
  if (value == null) return null;
  const text = value
    .toString()
    .replace(/ş/g, 'ș').replace(/Ş/g, 'Ș').replace(/ţ/g, 'ț').replace(/Ţ/g, 'Ț')
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
}

const capitalize = (text) => (text ? text.charAt(0).toLocaleUpperCase('ro-RO') + text.slice(1) : text);

// ── Țări ─────────────────────────────────────────────────────────────────
// Forma canonică e în română; aliasurile acoperă engleza (răspunsurile AI), forma fără diacritice și limba locală.
const COUNTRIES = {
  România: ['romania', 'ro', 'rumania', 'roumanie'],
  'Republica Moldova': ['moldova', 'republic of moldova', 'rep. moldova', 'md'],
  Italia: ['italy', 'it', 'italie'],
  Franța: ['france', 'franta', 'fr'],
  Spania: ['spain', 'espana', 'es', 'espagne'],
  Portugalia: ['portugal', 'pt'],
  Germania: ['germany', 'deutschland', 'de', 'allemagne'],
  Austria: ['osterreich', 'at', 'autriche'],
  Ungaria: ['hungary', 'magyarorszag', 'hu'],
  Bulgaria: ['bg'],
  Grecia: ['greece', 'hellas', 'gr'],
  Croația: ['croatia', 'hrvatska', 'croatia'],
  Slovenia: ['slovenija', 'si'],
  Serbia: ['srbija', 'rs'],
  Georgia: ['sakartvelo', 'ge'],
  Ucraina: ['ukraine', 'ua'],
  Elveția: ['switzerland', 'schweiz', 'suisse', 'elvetia', 'ch'],
  Argentina: ['ar'],
  Chile: ['cl'],
  'Statele Unite': ['usa', 'us', 'united states', 'statele unite ale americii', 'sua'],
  Australia: ['au'],
  'Noua Zeelandă': ['new zealand', 'noua zeelanda', 'nz'],
  'Africa de Sud': ['south africa', 'za'],
  Liban: ['lebanon', 'lb'],
  Israel: ['il'],
  Turcia: ['turkey', 'turkiye', 'tr'],
  Uruguay: ['uy'],
  Brazilia: ['brazil', 'brasil', 'br'],
  Mexic: ['mexico', 'mx'],
  Canada: ['ca'],
  China: ['cn'],
  Japonia: ['japan', 'jp'],
  Anglia: ['england', 'united kingdom', 'uk', 'marea britanie', 'great britain'],
  Cehia: ['czech republic', 'czechia', 'cesko', 'cz'],
  Slovacia: ['slovakia', 'sk'],
  Macedonia: ['north macedonia', 'macedonia de nord', 'mk'],
  Armenia: ['am'],
  Cipru: ['cyprus', 'cy'],
  Luxemburg: ['luxembourg', 'lu'],
  Muntenegru: ['montenegro', 'me'],
};

const COUNTRY_INDEX = new Map();
for (const [canonical, aliases] of Object.entries(COUNTRIES)) {
  COUNTRY_INDEX.set(foldKey(canonical), canonical);
  for (const alias of aliases) COUNTRY_INDEX.set(foldKey(alias), canonical);
}

export const CANONICAL_COUNTRIES = Object.keys(COUNTRIES);

export function normalizeCountry(value) {
  const text = cleanText(value);
  if (!text) return null;
  return COUNTRY_INDEX.get(foldKey(text)) ?? capitalize(text);
}

// ── Locații ──────────────────────────────────────────────────────────────
// Refolosește forma deja existentă la utilizator ("Bucătărie" câștigă în fața lui "bucatarie ")
export function normalizeLocation(value, existing = []) {
  const text = cleanText(value);
  if (!text) return null;
  const key = foldKey(text);
  const match = existing.map(cleanText).find((item) => item && foldKey(item) === key);
  return match ?? capitalize(text);
}

// Locațiile unice ale unui utilizator, deduplicate; preferă forma cu diacritice
export function dedupeLocations(values) {
  const byKey = new Map();
  for (const value of values) {
    const text = cleanText(value);
    if (!text) continue;
    const key = foldKey(text);
    const current = byKey.get(key);
    const score = (item) => (item.normalize('NFD').length - item.length) * 2 + (/^\p{Lu}/u.test(item) ? 1 : 0);
    if (!current || score(text) > score(current)) byKey.set(key, text);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b, 'ro'));
}

// ── Arome ────────────────────────────────────────────────────────────────
export const AROMA_CATEGORIES = {
  RED_FRUIT: 'Fructe roșii',
  BLACK_FRUIT: 'Fructe negre',
  CITRUS: 'Citrice',
  TREE_FRUIT: 'Fructe albe și galbene',
  TROPICAL: 'Fructe tropicale',
  DRIED_FRUIT: 'Fructe uscate',
  FLORAL: 'Flori',
  HERBAL: 'Ierburi și vegetal',
  SPICE: 'Condimente',
  OAK: 'Lemn și vanilie',
  EARTH: 'Pământ și piele',
  MINERAL: 'Mineral',
  SWEET: 'Dulce și prăjit',
};

// Arome canonice → categorie, cu aliasuri (fără diacritice, engleză, plural/singular)
const AROMAS = {
  RED_FRUIT: { 'cireșe': ['cirese', 'cireasa', 'cireașă', 'cherry', 'cherries'], 'vișine': ['visine', 'visina', 'vișină', 'sour cherry'], 'căpșuni': ['capsuni', 'căpșună', 'capsuna', 'strawberry'], 'zmeură': ['zmeura', 'raspberry'], 'coacăze roșii': ['coacaze rosii', 'red currant'], 'merișoare': ['merisoare', 'cranberry'], 'rodie': ['pomegranate'], 'fructe roșii': ['fructe rosii', 'red fruit', 'red fruits'] },
  BLACK_FRUIT: { 'mure': ['mură', 'mura', 'blackberry'], 'coacăze negre': ['coacaze negre', 'cassis', 'blackcurrant', 'black currant', 'coacăze', 'coacaze'], 'prune': ['prună', 'pruna', 'plum'], 'afine': ['afină', 'afina', 'blueberry'], 'fructe negre': ['black fruit', 'black fruits', 'fructe de pădure', 'fructe de padure'] },
  CITRUS: { 'lămâie': ['lamaie', 'lemon'], 'lime': ['lămâie verde', 'lamaie verde'], 'grepfrut': ['grapefruit'], 'portocală': ['portocala', 'orange'], 'citrice': ['citrus'] },
  TREE_FRUIT: { 'măr verde': ['mar verde', 'green apple'], 'măr': ['mar', 'apple'], 'pară': ['para', 'pear'], 'piersică': ['piersica', 'piersici', 'peach'], 'caisă': ['caisa', 'caise', 'apricot'], 'gutuie': ['quince'] },
  TROPICAL: { 'ananas': ['pineapple'], 'mango': [], 'fructul pasiunii': ['passion fruit', 'maracuja'], 'banană': ['banana'], 'pepene galben': ['melon'], 'litchi': ['lychee'] },
  DRIED_FRUIT: { 'stafide': ['raisin', 'raisins'], 'smochine': ['fig', 'figs', 'smochină', 'smochina'], 'curmale': ['dates'], 'prune uscate': ['prune', 'dried plum'] },
  FLORAL: { 'trandafir': ['rose', 'trandafiri'], 'violete': ['violetă', 'violeta', 'violet', 'viorele'], 'flori albe': ['white flowers', 'flori de salcâm', 'flori de salcam'], 'tei': ['linden'], 'soc': ['elderflower', 'floare de soc'], 'flori': ['floral'] },
  HERBAL: { 'ierburi': ['herbs', 'herbal', 'ierbos'], 'ardei gras': ['bell pepper', 'green pepper'], 'mentă': ['menta', 'mint'], 'eucalipt': ['eucalyptus'], 'iarbă proaspătă': ['iarba proaspata', 'cut grass', 'grass', 'iarbă', 'iarba'], 'fân': ['fan', 'hay'], 'tomate': ['tomato leaf'] },
  SPICE: { 'piper negru': ['piper', 'black pepper', 'pepper'], 'scorțișoară': ['scortisoara', 'cinnamon'], 'cuișoare': ['cuisoare', 'clove', 'cloves'], 'anason': ['anise', 'licorice', 'lemn dulce'], 'nucșoară': ['nucsoara', 'nutmeg'], 'condimente': ['spice', 'spices', 'condimentat'] },
  OAK: { 'vanilie': ['vanilla'], 'stejar': ['oak', 'lemn', 'wood'], 'cedru': ['cedar'], 'fum': ['smoke', 'smoky', 'afumat'], 'cocos': ['coconut'], 'pâine prăjită': ['paine prajita', 'toast', 'toasty'] },
  EARTH: { 'piele': ['leather'], 'tutun': ['tobacco'], 'pământ': ['pamant', 'earth', 'earthy'], 'ciuperci': ['mushroom', 'mushrooms'], 'trufe': ['truffle', 'truffles'], 'frunze uscate': ['dried leaves', 'forest floor'] },
  MINERAL: { 'mineral': ['minerală', 'minerala', 'minerality'], 'cremene': ['flint', 'silex'], 'sare': ['salin', 'saline', 'salty'], 'grafit': ['graphite'] },
  SWEET: { 'miere': ['honey'], 'ciocolată': ['ciocolata', 'chocolate', 'cacao', 'cocoa'], 'cafea': ['coffee'], 'caramel': ['caramelă', 'butterscotch'], 'nuci': ['nucă', 'nuca', 'walnut', 'nuts'], 'migdale': ['almond', 'almonds'], 'unt': ['butter', 'buttery'], 'brioșă': ['briosa', 'brioche'] },
};

const AROMA_INDEX = new Map();
for (const [category, items] of Object.entries(AROMAS)) {
  for (const [canonical, aliases] of Object.entries(items)) {
    AROMA_INDEX.set(foldKey(canonical), { name: canonical, category });
    for (const alias of aliases) if (!AROMA_INDEX.has(foldKey(alias))) AROMA_INDEX.set(foldKey(alias), { name: canonical, category });
  }
}

export const AROMA_VOCABULARY = Object.fromEntries(
  Object.entries(AROMAS).map(([category, items]) => [category, Object.keys(items)]),
);

// { name, category } pentru o aromă; aromele necunoscute rămân cu textul curățat și category = null
export function classifyAroma(value) {
  const text = cleanText(value);
  if (!text) return null;
  return AROMA_INDEX.get(foldKey(text)) ?? { name: text.toLocaleLowerCase('ro-RO'), category: null };
}

export function normalizeAromas(values = []) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const aroma = classifyAroma(value);
    if (!aroma || seen.has(foldKey(aroma.name))) continue;
    seen.add(foldKey(aroma.name));
    out.push(aroma.name);
  }
  return out;
}

// Liste text (soiuri, asocieri): curățate, fără duplicate (diacritic-insensitive), ordinea păstrată
export function normalizeList(values = []) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const text = cleanText(value);
    if (!text || seen.has(foldKey(text))) continue;
    seen.add(foldKey(text));
    out.push(text);
  }
  return out;
}

// ── Culoare ──────────────────────────────────────────────────────────────
// Soiuri care, vinificate ca spumant/desert/fortifiat, dau de obicei vin roșu
const RED_GRAPES = new Set([
  'cabernet sauvignon', 'cabernet franc', 'merlot', 'pinot noir', 'syrah', 'shiraz', 'tempranillo', 'sangiovese',
  'nebbiolo', 'grenache', 'garnacha', 'malbec', 'zinfandel', 'primitivo', 'touriga nacional', 'feteasca neagra',
  'babeasca neagra', 'negru de dragasani', 'novac', 'cadarca', 'kadarka', 'saperavi', 'lambrusco', 'brachetto',
  'montepulciano', 'barbera', 'corvina', 'carmenere', 'pinotage', 'mourvedre', 'monastrell', 'tinta roriz', 'rara neagra',
].map(foldKey));

// Culoarea derivată când lipsește: tipul o dă direct pentru RED/WHITE/ROSE,
// iar pentru spumant/desert/fortifiat decid soiurile (fără soiuri cunoscute → null, nu ghicim)
export function deriveColor({ type, grapeVarieties = [] } = {}) {
  if (type === 'RED') return 'RED';
  if (type === 'WHITE') return 'WHITE';
  if (type === 'ROSE') return 'ROSE';
  if (!['SPARKLING', 'DESSERT', 'FORTIFIED'].includes(type) || !grapeVarieties.length) return null;
  const keys = grapeVarieties.map(foldKey);
  if (keys.some((key) => /\b(rose|rosato|rosado)\b/.test(key))) return 'ROSE';
  return keys.every((key) => RED_GRAPES.has(key)) ? 'RED' : keys.some((key) => RED_GRAPES.has(key)) ? null : 'WHITE';
}

// Normalizarea completă a unui vin înainte de scriere (input deja validat de WineInputSchema)
export function normalizeWineData(data, { existingLocations = [] } = {}) {
  const out = { ...data };
  for (const field of ['name', 'producer', 'region', 'subregion', 'tastingNotes', 'servingTemperature', 'agingPotential']) {
    if (field in out) out[field] = cleanText(out[field]) ?? (field === 'name' ? out[field] : null);
  }
  if ('country' in out) out.country = normalizeCountry(out.country);
  if ('cellarLocation' in out) out.cellarLocation = normalizeLocation(out.cellarLocation, existingLocations);
  if ('grapeVarieties' in out) out.grapeVarieties = normalizeList(out.grapeVarieties);
  if ('foodPairing' in out) out.foodPairing = normalizeList(out.foodPairing);
  if ('aromaProfile' in out) out.aromaProfile = normalizeAromas(out.aromaProfile);
  if (!out.color && out.type) out.color = deriveColor(out) ?? undefined;
  return out;
}
