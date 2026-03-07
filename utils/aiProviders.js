// utils/aiProviders.js
// Sistem de provideri AI interschimbabili pentru analiza etichetelor de vin

const PROMPT = `Analizează această etichetă de vin și extrage informațiile disponibile.
Returnează DOAR un obiect JSON valid, fără text adițional, fără markdown, fără backticks.
Câmpurile posibile (lasă null dacă nu e vizibil):
{
  "name": "numele vinului",
  "producer": "producătorul / domeniul",
  "country": "țara de origine (în română, ex: Franța, România, Italia)",
  "region": "regiunea viticolă",
  "subregion": "subregiunea dacă există",
  "vintage": numărul anului ca integer sau null,
  "type": "RED sau WHITE sau ROSE sau SPARKLING sau DESSERT sau FORTIFIED",
  "alcoholPercentage": numărul procentului ca float sau null,
  "grapeVarieties": "soiurile de struguri separate prin virgulă sau null",
  "agingPotential": "ex: 2026-2030 sau 5-10 ani sau null",
  "servingTemperature": "ex: 16-18°C sau null",
  "tastingNotes": "note de degustare dacă sunt menționate pe etichetă sau null"
}
Fii precis. Dacă nu ești sigur de un câmp, lasă null.`;

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
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
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
      model: 'claude-opus-4-6',
      max_tokens: 1024,
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
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: 'low' } }
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
      max_tokens: 1024,
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
    // Curăță markdown dacă există
    const clean = rawText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    
    // Găsește primul obiect JSON valid
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Nu s-a găsit JSON valid');
    
    const parsed = JSON.parse(match[0]);
    
    // Normalizează câmpurile
    return {
      name:               parsed.name               || '',
      producer:           parsed.producer           || '',
      country:            parsed.country            || '',
      region:             parsed.region             || '',
      subregion:          parsed.subregion          || '',
      vintage:            parsed.vintage?.toString() || '',
      type:               ['RED','WHITE','ROSE','SPARKLING','DESSERT','FORTIFIED'].includes(parsed.type) ? parsed.type : 'RED',
      alcoholPercentage:  parsed.alcoholPercentage?.toString() || '',
      grapeVarieties:     parsed.grapeVarieties     || '',
      agingPotential:     parsed.agingPotential     || '',
      servingTemperature: parsed.servingTemperature || '',
      tastingNotes:       parsed.tastingNotes       || '',
    };
  } catch (e) {
    throw new Error('Nu s-au putut interpreta datele returnate de AI');
  }
}

// ── MAIN EXPORT ────────────────────────────────────────────────────────────
export const AI_PROVIDERS = {
  gemini: { name: 'Google Gemini', label: 'Gemini 1.5 Flash', free: true,  envKey: 'GEMINI_API_KEY' },
  claude: { name: 'Claude',        label: 'Claude (Anthropic)', free: false, envKey: 'CLAUDE_API_KEY' },
  openai: { name: 'OpenAI',        label: 'GPT-4o Mini',        free: false, envKey: 'OPENAI_API_KEY' },
  groq:   { name: 'Groq',          label: 'Llama 4 Scout',      free: true,  envKey: 'GROQ_API_KEY' },
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