// utils/aiProviders.js
// Sistem de provideri AI interschimbabili pentru analiza etichetelor de vin

// ── PROMPT ─────────────────────────────────────────────────────────────────
const PROMPT = `Ești un expert sommelier și consultant de vinuri cu cunoștințe extinse despre prețurile pieței și perioadele de maturare.
Analizează cu atenție această imagine de etichetă și extrage informațiile vizibile, apoi COMPLETEAZĂ cu cunoștințele tale despre acest vin.

Returnează DOAR un obiect JSON valid. Niciun text înainte sau după. Niciun "Iată răspunsul:". Nicio explicație. Niciun markdown. Niciun backtick.

Structura JSON obligatorie (toate câmpurile trebuie să existe, chiar dacă unele sunt null):
{
  "name": "numele vinului — OBLIGATORIU dacă e vizibil",
  "producer": "producătorul / crama / domeniul",
  "country": "țara de origine în română (ex: România, Franța, Italia, Spania, Germania, Argentina, Chile, SUA)",
  "region": "regiunea viticolă (ex: Dealu Mare, Bordeaux, Toscana, Rioja)",
  "subregion": "subregiunea sau denumirea de origine (ex: Pauillac, Chianti Classico)",
  "vintage": anul recoltei ca număr întreg sau null,
  "type": "OBLIGATORIU: RED, WHITE, ROSE, SPARKLING, DESSERT sau FORTIFIED",
  "alcoholPercentage": procentul de alcool — citit de pe etichetă SAU estimat (ex: 13.5),
  "bottleSize": "mărimea sticlei de pe etichetă sau '0.75L' ca default dacă nu e specificat",
  "grapeVarieties": "soiurile de struguri — citite de pe etichetă SAU deduse din cunoștințele tale",
  "agingPotential": "potențialul de maturare — de pe etichetă SAU estimat (ex: '10-20 ani')",
  "servingTemperature": "temperatura de servire (ex: 16-18°C)",
  "tastingNotes": "notele de degustare — de pe etichetă SAU din cunoștințele tale",
  "foodPairing": "asocierile gastronomice recomandate",
  "estimatedValue": valoarea estimată în EUR ca număr sau null,
  "aromaProfile": ["aromă1", "aromă2", "aromă3", "aromă4"],
  "drinkFrom": anul optim de început ca număr întreg sau null,
  "drinkUntil": anul optim de sfârșit ca număr întreg sau null
}

REGULI DE ESTIMARE (obligatorii):
- "estimatedValue": estimează un preț corect pentru piața din Europa. Dacă nu știi, folosește euristici: vin de masă 5-10€, DOC/DOCG 10-30€, cru-uri clasate peste 50€. Nu lăsa null decât dacă e imposibil.
- "agingPotential": oferă un interval în ani (ex: '8-12 ani'). Pentru vinuri de zi cu zi, '1-3 ani'.
- "drinkFrom" și "drinkUntil": calculează pe baza vintage-ului și tipului. De exemplu, un Barolo 2019: drinkFrom = 2027, drinkUntil = 2040. Un alb sec 2023: drinkFrom = 2023, drinkUntil = 2026.
- Dacă vintage-ul lipsește, lasă drinkFrom/drinkUntil null.

Exemplu de output corect:
{"name":"Barolo","producer":"Giacomo Conterno","country":"Italia","region":"Piemont","subregion":"Barolo","vintage":2019,"type":"RED","alcoholPercentage":14,"bottleSize":"0.75L","grapeVarieties":"Nebbiolo","agingPotential":"15-25 ani","servingTemperature":"16-18°C","tastingNotes":"Tanini fermi, aciditate înaltă, arome de trandafir uscat, gudron și fructe roșii","foodPairing":"Brasato, trufe, vânat, brânzeturi maturate","estimatedValue":65,"aromaProfile":["trandafir uscat","gudron","cireaș","piele","tutun","pămant"],"drinkFrom":2027,"drinkUntil":2042}`;

// ── CONSTANTE ──────────────────────────────────────────────────────────────
const VALID_TYPES = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED'];
const VALID_SIZES = ['0.187L', '0.375L', '0.5L', '0.75L', '1L', '1.5L', '3L', '6L'];
const CURRENT_YEAR = new Date().getFullYear();

// ── HELPERS ────────────────────────────────────────────────────────────────

/** Sleep util pentru backoff */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Extrage și parsează JSON din răspunsul brut al AI-ului */
function extractJSON(rawText) {
  const clean = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Nu s-a găsit JSON valid în răspunsul AI');

  return JSON.parse(match[0]);
}

/** Normalizează bottleSize la unul din valorile acceptate */
function normalizeBottleSize(raw) {
  if (!raw) return '0.75L';
  const s = raw.toString().toLowerCase().replace(/\s/g, '');
  if (s.includes('750') || s === '0.75l' || s === '75cl') return '0.75L';
  if (s.includes('375') || s === '0.375l' || s === '37.5cl') return '0.375L';
  if (s.includes('187') || s === '0.187l') return '0.187L';
  if (s.includes('500') || s === '0.5l' || s === '50cl') return '0.5L';
  if (s.includes('1500') || s === '1.5l' || s === '150cl') return '1.5L';
  if (s === '1l' || s === '100cl' || s === '1000ml') return '1L';
  if (s === '3l' || s === '3000ml') return '3L';
  if (s === '6l' || s === '6000ml') return '6L';
  return VALID_SIZES.includes(raw) ? raw : '0.75L';
}

/** Normalizează procentul de alcool — validează că e în interval rezonabil */
function normalizeAlcohol(raw) {
  const val = parseFloat(raw);
  if (isNaN(val) || val < 5 || val > 25) return '';
  return val.toString();
}

/** Normalizează un an — validează că e în interval rezonabil */
function normalizeYear(raw, { min = 1800, max = CURRENT_YEAR + 30 } = {}) {
  const y = parseInt(raw);
  return !isNaN(y) && y >= min && y <= max ? y : null;
}

/** Normalizează valoarea estimată în EUR (returnează număr sau null) */
function normalizeValue(raw) {
  if (raw === null || raw === undefined) return null;
  const val = parseFloat(raw);
  if (isNaN(val) || val <= 0) return null;
  return parseFloat(val.toFixed(2)); // număr, nu string
}

// ── FUNCȚII DE FALLBACK PENTRU CÂMPURILE LIPSE ─────────────────────────────

/** Estimează valoarea pe baza tipului, vintage-ului și regiunii */
function estimateValue(vintage, type, country, region) {
  if (vintage && type === 'RED' && vintage < CURRENT_YEAR - 10) return 25;
  if (type === 'SPARKLING' || type === 'FORTIFIED') return 15;
  if (type === 'DESSERT') return 20;
  if (type === 'RED') {
    if (vintage && vintage >= 2015) return 12;
    if (vintage && vintage >= 2010) return 18;
    return 10;
  }
  if (type === 'WHITE' || type === 'ROSE') {
    if (vintage && vintage >= 2015) return 10;
    if (vintage && vintage >= 2010) return 14;
    return 8;
  }
  return 10;
}

/** Generează potențial de îmbătrânire pe baza tipului și vintage-ului */
function generateAgingPotential(vintage, type) {
  if (!vintage) return '1-3 ani';
  if (type === 'RED' && vintage >= 2010) return '8-15 ani';
  if (type === 'RED') return '3-8 ani';
  if (type === 'WHITE' && vintage >= 2015) return '2-5 ani';
  if (type === 'WHITE') return '1-3 ani';
  if (type === 'ROSE' || type === 'SPARKLING') return '1-2 ani';
  if (type === 'DESSERT' || type === 'FORTIFIED') return '10-20 ani';
  return '1-3 ani';
}

/** Calculează fereastra optimă de consum pe baza vintage-ului și tipului */
function calculateDrinkWindow(vintage, type) {
  if (!vintage) return { drinkFrom: null, drinkUntil: null };
  const vyear = parseInt(vintage);
  if (isNaN(vyear)) return { drinkFrom: null, drinkUntil: null };

  let drinkFrom = vyear, drinkUntil = vyear;
  if (type === 'RED') {
    if (vyear >= 2015) { drinkFrom = vyear + 5; drinkUntil = vyear + 20; }
    else if (vyear >= 2010) { drinkFrom = vyear + 3; drinkUntil = vyear + 15; }
    else { drinkFrom = vyear + 2; drinkUntil = vyear + 10; }
  } else if (type === 'WHITE' || type === 'ROSE') {
    drinkFrom = vyear;
    drinkUntil = vyear + 5;
  } else if (type === 'SPARKLING') {
    drinkFrom = vyear;
    drinkUntil = vyear + 3;
  } else if (type === 'DESSERT' || type === 'FORTIFIED') {
    drinkFrom = vyear + 5;
    drinkUntil = vyear + 25;
  }
  return { drinkFrom, drinkUntil };
}

// ── PARSER CU FALLBACK ─────────────────────────────────────────────────────
function parseWineData(rawText) {
  try {
    const parsed = extractJSON(rawText);

    // Normalizări de bază
    const vintage = normalizeYear(parsed.vintage, { min: 1800, max: CURRENT_YEAR });
    const type = VALID_TYPES.includes(parsed.type) ? parsed.type : 'RED';

    // Preluăm valorile furnizate de AI (pot fi null)
    let estimatedValue = normalizeValue(parsed.estimatedValue);
    let agingPotential = parsed.agingPotential?.trim() || '';
    let drinkFrom = normalizeYear(parsed.drinkFrom, { min: 1900, max: 2100 });
    let drinkUntil = normalizeYear(parsed.drinkUntil, { min: 1900, max: 2100 });

    // --- FALLBACK pentru estimatedValue ---
    if (estimatedValue === null && vintage) {
      estimatedValue = estimateValue(vintage, type, parsed.country, parsed.region);
    }

    // --- FALLBACK pentru agingPotential ---
    if (!agingPotential && vintage) {
      agingPotential = generateAgingPotential(vintage, type);
    } else if (!agingPotential && !vintage) {
      agingPotential = '1-3 ani';
    }

    // --- FALLBACK pentru drinkFrom/drinkUntil ---
    if ((drinkFrom === null || drinkUntil === null) && vintage) {
      const window = calculateDrinkWindow(vintage, type);
      if (drinkFrom === null) drinkFrom = window.drinkFrom;
      if (drinkUntil === null) drinkUntil = window.drinkUntil;
    }

    // Validare suplimentară: drinkUntil >= drinkFrom
    if (drinkFrom && drinkUntil && drinkUntil < drinkFrom) {
      drinkUntil = drinkFrom + 1;
    }

    return {
      name:               parsed.name               || '',
      producer:           parsed.producer           || '',
      country:            parsed.country            || '',
      region:             parsed.region             || '',
      subregion:          parsed.subregion          || '',
      vintage:            vintage ? vintage.toString() : '',
      type,
      alcoholPercentage:  normalizeAlcohol(parsed.alcoholPercentage),
      bottleSize:         normalizeBottleSize(parsed.bottleSize),
      grapeVarieties:     parsed.grapeVarieties     || '',
      agingPotential,
      servingTemperature: parsed.servingTemperature || '',
      tastingNotes:       parsed.tastingNotes       || '',
      foodPairing:        parsed.foodPairing        || '',
      estimatedValue:     estimatedValue, // număr sau null
      aromaProfile:       Array.isArray(parsed.aromaProfile)
                            ? parsed.aromaProfile.filter(Boolean)
                            : [],
      drinkFrom,
      drinkUntil,
      quantity:           '1',
      status:             'IN_CELLAR',
      isFavorite:         false,
    };
  } catch (e) {
    throw new Error(`Nu s-au putut interpreta datele returnate de AI: ${e.message}`);
  }
}

// ── PROVIDER IMPLEMENTATIONS ───────────────────────────────────────────────

/** Provider compatibil cu API-ul OpenAI (OpenAI, Groq etc.) */
async function analyzeWithOpenAICompatible(imageBase64, mimeType, apiKey, { url, model }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `${model} error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

async function analyzeWithGemini(imageBase64, mimeType, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
          ],
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error: ${response.status}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function analyzeWithClaude(imageBase64, mimeType, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: PROMPT },
        ],
      }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude error: ${response.status}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

/** Mapa provider → funcție de analiză */
const PROVIDER_FN = {
  gemini: (img, mime, key) => analyzeWithGemini(img, mime, key),
  claude: (img, mime, key) => analyzeWithClaude(img, mime, key),
  openai: (img, mime, key) => analyzeWithOpenAICompatible(img, mime, key, {
    url:   'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
  }),
  groq: (img, mime, key) => analyzeWithOpenAICompatible(img, mime, key, {
    url:   'https://api.groq.com/openai/v1/chat/completions',
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
  }),
};

// ── RETRY LOGIC ────────────────────────────────────────────────────────────

async function withRetry(fn, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const rawText = await fn();
      return parseWineData(rawText);
    } catch (e) {
      lastError = e;
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt);
        console.warn(`[aiProviders] Attempt ${attempt + 1} failed: ${e.message}. Retrying in ${delay}ms…`);
        await sleep(delay);
      }
    }
  }
  throw lastError;
}

// ── VALIDARE INPUT ─────────────────────────────────────────────────────────
function validateInput(imageBase64, mimeType, provider, apiKey) {
  if (!imageBase64 || imageBase64.length < 100)
    throw new Error('Imaginea lipsește sau este invalidă.');

  if (!mimeType || !mimeType.startsWith('image/'))
    throw new Error(`Tip MIME invalid: "${mimeType}". Folosiți image/jpeg, image/png etc.`);

  if (!AI_PROVIDERS[provider])
    throw new Error(`Provider necunoscut: "${provider}". Valori acceptate: ${Object.keys(AI_PROVIDERS).join(', ')}.`);

  if (!apiKey?.trim())
    throw new Error(`Lipsește API key-ul pentru provider-ul "${provider}".`);
}

// ── PUBLIC API ─────────────────────────────────────────────────────────────
export const AI_PROVIDERS = {
  gemini: { name: 'Google Gemini', label: 'Gemini 2.0 Flash',  free: true,  envKey: 'GEMINI_API_KEY' },
  claude: { name: 'Claude',        label: 'Claude Sonnet 4.5', free: false, envKey: 'CLAUDE_API_KEY' },
  openai: { name: 'OpenAI',        label: 'GPT-4o Mini',       free: false, envKey: 'OPENAI_API_KEY' },
  groq:   { name: 'Groq',          label: 'Llama 4 Scout',     free: true,  envKey: 'GROQ_API_KEY'   },
};

/**
 * Analizează o etichetă de vin folosind provider-ul ales, cu retry automat.
 */
export async function analyzeWineLabel(
  imageBase64,
  mimeType,
  provider,
  apiKey,
  { maxRetries = 2, fallbackProviders = [] } = {}
) {
  validateInput(imageBase64, mimeType, provider, apiKey);

  const queue = [
    { provider, apiKey },
    ...fallbackProviders.filter(
      (fb) => fb.provider && fb.apiKey && AI_PROVIDERS[fb.provider]
    ),
  ];

  let lastError;
  for (const { provider: p, apiKey: k } of queue) {
    const fn = PROVIDER_FN[p];
    if (!fn) continue;
    try {
      console.info(`[aiProviders] Using provider: ${p}`);
      return await withRetry(() => fn(imageBase64, mimeType, k), maxRetries);
    } catch (e) {
      lastError = e;
      console.warn(`[aiProviders] Provider "${p}" a eșuat definitiv: ${e.message}`);
    }
  }
  throw new Error(`Analiza etichetei a eșuat pe toți providerii. Ultima eroare: ${lastError?.message}`);
}