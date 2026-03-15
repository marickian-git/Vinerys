// utils/aiProviders.js
// Sistem de provideri AI interschimbabili pentru analiza etichetelor de vin

const PROMPT = `Ești un expert sommelier și consultant de vinuri cu cunoștințe extinse despre prețurile pieței.
Analizează cu atenție această imagine de etichetă și extrage informațiile vizibile, apoi COMPLETEAZĂ cu cunoștințele tale despre acest vin.

Returnează DOAR un obiect JSON valid, fără text adițional, fără markdown, fără backticks.

{
  "name": "numele vinului — OBLIGATORIU dacă e vizibil",
  "producer": "producătorul / crama / domeniul",
  "country": "țara de origine în română (ex: România, Franța, Italia, Spania, Germania, Argentina, Chile, SUA)",
  "region": "regiunea viticolă (ex: Dealu Mare, Bordeaux, Toscana, Rioja)",
  "subregion": "subregiunea sau denumirea de origine (ex: Pauillac, Chianti Classico)",
  "vintage": anul recoltei ca număr întreg sau null,
  "type": "OBLIGATORIU: RED, WHITE, ROSE, SPARKLING, DESSERT sau FORTIFIED",
  "alcoholPercentage": procentul de alcool — citit de pe etichetă SAU estimat din cunoștințele tale despre acest tip de vin și regiune (ex: 13.5),
  "bottleSize": "mărimea sticlei de pe etichetă sau '0.75L' ca default dacă nu e specificat",
  "grapeVarieties": "soiurile de struguri — citite de pe etichetă SAU deduse din cunoștințele tale despre acest vin/regiune/producător (ex: pentru Barolo → Nebbiolo, pentru Bordeaux roșu → Cabernet Sauvignon, Merlot)",
  "agingPotential": "potențialul de maturare — de pe etichetă SAU estimat din cunoștințele tale (ex: un Barolo 2019 → 10-20 ani, un vin de masă → 1-2 ani)",
  "servingTemperature": "temperatura de servire — de pe etichetă SAU din cunoștințele tale (ex: vinuri roșii full-body → 16-18°C, albe seci → 8-10°C, spumante → 6-8°C)",
  "tastingNotes": "notele de degustare — de pe etichetă SAU din cunoștințele tale despre acest vin (arome tipice, structură, finisaj)",
  "foodPairing": "asocierile gastronomice — de pe etichetă SAU recomandate de tine pentru acest tip de vin",
  "estimatedValue": valoarea estimată în EUR bazată pe producător, regiune, vintage și reputație sau null dacă vinul e complet necunoscut
}

REGULI IMPORTANTE:
- Câmpul "type" este OBLIGATORIU — deduce-l dacă nu e explicit
- Câmpul "name" este OBLIGATORIU — dacă e o denumire de origine (Barolo, Rioja), folosește-o ca nume
- "bottleSize": dacă nu e menționat pe etichetă, pune "0.75L" ca default
- "alcoholPercentage": dacă nu e vizibil, estimează bazat pe tipul vinului și regiune (vinuri roșii italiene ~13-14%, burgundy ~12.5-13%, etc.)
- "grapeVarieties": COMPLETEAZĂ DIN CUNOȘTINȚELE TALE dacă știi ce soiuri sunt folosite în acea regiune/DOC/AOC, chiar dacă nu sunt pe etichetă
- "agingPotential": ESTIMEAZĂ întotdeauna bazat pe tipul vinului, producătorul și vintage (vinuri premium → potențial mai lung)
- "servingTemperature": COMPLETEAZĂ întotdeauna bazat pe tipul vinului dacă nu e pe etichetă
- "tastingNotes": DESCRIE aromele și caracteristicile tipice ale acestui vin din cunoștințele tale dacă nu sunt pe etichetă
- "foodPairing": RECOMANDĂ asocieri potrivite bazat pe tipul și stilul vinului dacă nu sunt pe etichetă
- "estimatedValue": estimează prețul de retail în EUR. Lasă null doar dacă vinul e complet necunoscut
- Pentru vinuri românești: Dealu Mare, Cotnari, Murfatlar, Recaș, Cramele Recaș, Vinarte, Davino sunt frecvente
- "country": mereu în română (Franța nu France, Italia nu Italy)
- Nu inventa informații de bază (name, producer, vintage) dacă nu sunt vizibile, dar COMPLETEAZĂ câmpurile de expertiză`;

// ── GEMINI ─────────────────────────────────────────────────────────────────
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
            { inline_data: { mime_type: mimeType, data: imageBase64 } }
          ]
        }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1500 }
      })
    }
  );
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `Gemini error: ${response.status}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

// ── CLAUDE ─────────────────────────────────────────────────────────────────
async function analyzeWithClaude(imageBase64, mimeType, apiKey) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
          { type: 'text', text: PROMPT }
        ]
      }]
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `Claude error: ${response.status}`);
  }
  const data = await response.json();
  return data.content?.[0]?.text || '';
}

// ── OPENAI ─────────────────────────────────────────────────────────────────
async function analyzeWithOpenAI(imageBase64, mimeType, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'high' } }
        ]
      }]
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `OpenAI error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── GROQ ───────────────────────────────────────────────────────────────────
async function analyzeWithGroq(imageBase64, mimeType, apiKey) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
        ]
      }]
    })
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || `Groq error: ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── PARSER ─────────────────────────────────────────────────────────────────
function parseWineData(rawText) {
  try {
    const clean = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Nu s-a găsit JSON valid');

    const parsed = JSON.parse(match[0]);

    const validTypes = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED'];
    const validSizes = ['0.187L', '0.375L', '0.5L', '0.75L', '1L', '1.5L', '3L', '6L'];

    // Normalizează bottleSize
    let bottleSize = null;
    if (parsed.bottleSize) {
      const bs = parsed.bottleSize.toString().toLowerCase().replace(/\s/g, '');
      if (bs.includes('750') || bs === '0.75l' || bs === '75cl') bottleSize = '0.75L';
      else if (bs.includes('375') || bs === '0.375l' || bs === '37.5cl') bottleSize = '0.375L';
      else if (bs.includes('500') || bs === '0.5l' || bs === '50cl') bottleSize = '0.5L';
      else if (bs.includes('1500') || bs === '1.5l' || bs === '150cl') bottleSize = '1.5L';
      else if (bs === '1l' || bs === '100cl' || bs === '1000ml') bottleSize = '1L';
      else if (bs.includes('187') || bs === '0.187l') bottleSize = '0.187L';
      else if (bs === '3l' || bs === '3000ml') bottleSize = '3L';
      else if (bs === '6l' || bs === '6000ml') bottleSize = '6L';
      else if (validSizes.includes(parsed.bottleSize)) bottleSize = parsed.bottleSize;
    }

    // Normalizează estimatedValue — acceptă string "25" sau "25.00" sau număr
    let estimatedValue = null;
    if (parsed.estimatedValue !== null && parsed.estimatedValue !== undefined) {
      const val = parseFloat(parsed.estimatedValue);
      if (!isNaN(val) && val > 0) estimatedValue = val.toFixed(2);
    }

    return {
      name:               parsed.name               || '',
      producer:           parsed.producer           || '',
      country:            parsed.country            || '',
      region:             parsed.region             || '',
      subregion:          parsed.subregion          || '',
      vintage:            parsed.vintage?.toString() || '',
      type:               validTypes.includes(parsed.type) ? parsed.type : 'RED',
      alcoholPercentage:  parsed.alcoholPercentage?.toString() || '',
      bottleSize:         bottleSize,
      grapeVarieties:     parsed.grapeVarieties     || '',
      agingPotential:     parsed.agingPotential     || '',
      servingTemperature: parsed.servingTemperature || '',
      tastingNotes:       parsed.tastingNotes       || '',
      foodPairing:        parsed.foodPairing        || '',
      estimatedValue:     estimatedValue,
      quantity:           '1',
      status:             'IN_CELLAR',
      isFavorite:         false,
    };
  } catch (e) {
    throw new Error('Nu s-au putut interpreta datele returnate de AI');
  }
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────
export const AI_PROVIDERS = {
  gemini: { name: 'Google Gemini', label: 'Gemini 2.0 Flash', free: true,  envKey: 'GEMINI_API_KEY' },
  claude: { name: 'Claude',        label: 'Claude Sonnet',     free: false, envKey: 'CLAUDE_API_KEY' },
  openai: { name: 'OpenAI',        label: 'GPT-4o Mini',       free: false, envKey: 'OPENAI_API_KEY' },
  groq:   { name: 'Groq',          label: 'Llama 4 Scout',     free: true,  envKey: 'GROQ_API_KEY' },
};

export async function analyzeWineLabel(imageBase64, mimeType, provider, apiKey) {
  let rawText;

  switch (provider) {
    case 'gemini': rawText = await analyzeWithGemini(imageBase64, mimeType, apiKey); break;
    case 'claude': rawText = await analyzeWithClaude(imageBase64, mimeType, apiKey); break;
    case 'openai': rawText = await analyzeWithOpenAI(imageBase64, mimeType, apiKey); break;
    case 'groq':   rawText = await analyzeWithGroq(imageBase64, mimeType, apiKey);   break;
    default: throw new Error(`Provider necunoscut: ${provider}`);
  }

  return parseWineData(rawText);
}