const VALID_TYPES = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED'];
const CURRENT_YEAR = new Date().getFullYear();
const PROMPT = `Read this wine label image. Return only valid JSON with these keys: name, producer, country, region, subregion, vintage, type, alcoholPercentage, bottleSize, grapeVarieties, agingPotential, servingTemperature, tastingNotes, foodPairing, estimatedValue, aromaProfile, drinkFrom, drinkUntil. Use null for unknown values. type must be RED, WHITE, ROSE, SPARKLING, DESSERT, or FORTIFIED. Do not invent text visible on the label.`;

export const AI_PROVIDERS = {
    gemini: { name: 'Google Gemini', label: 'Gemini 2.5 Flash', free: true, envKey: 'GEMINI_API_KEY' },
    groq: { name: 'Groq', label: 'Llama 4 Scout', free: true, envKey: 'GROQ_API_KEY' },
    openrouter: { name: 'OpenRouter', label: 'Gemma 3 27B free', free: true, envKey: 'OPENROUTER_API_KEY' },
    claude: { name: 'Anthropic Claude', label: 'Claude 3.5 Sonnet', free: false, envKey: 'CLAUDE_API_KEY' },
};

export const ENSEMBLE_DEFAULT_PROVIDERS = ['gemini', 'groq', 'openrouter'];

function parseJson(raw) {
    const text = raw.replace(/```json|```/gi, '').trim();
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Răspunsul AI nu conține JSON');
    return JSON.parse(match[0]);
}

function normalize(raw) {
    const vintage = Number.parseInt(raw.vintage, 10);
    const type = VALID_TYPES.includes(raw.type) ? raw.type : 'RED';
    const number = (value) => value === null || value === undefined || value === '' || Number.isNaN(Number(value)) ? null : Number(value);
    const year = Number.isInteger(vintage) && vintage >= 1800 && vintage <= CURRENT_YEAR ? vintage : null;
    return {
        name: raw.name?.toString().trim() || '', producer: raw.producer?.toString().trim() || '', country: raw.country?.toString().trim() || '',
        region: raw.region?.toString().trim() || '', subregion: raw.subregion?.toString().trim() || '', vintage: year?.toString() || '', type,
        alcoholPercentage: number(raw.alcoholPercentage)?.toString() || '', bottleSize: raw.bottleSize?.toString().trim() || '0.75L',
        grapeVarieties: Array.isArray(raw.grapeVarieties) ? raw.grapeVarieties.join(', ') : (raw.grapeVarieties?.toString() || ''),
        agingPotential: raw.agingPotential?.toString().trim() || '', servingTemperature: raw.servingTemperature?.toString().trim() || '',
        tastingNotes: raw.tastingNotes?.toString().trim() || '', foodPairing: Array.isArray(raw.foodPairing) ? raw.foodPairing.join(', ') : (raw.foodPairing?.toString() || ''),
        estimatedValue: number(raw.estimatedValue), aromaProfile: Array.isArray(raw.aromaProfile) ? raw.aromaProfile.filter(Boolean).slice(0, 6) : [],
        drinkFrom: number(raw.drinkFrom), drinkUntil: number(raw.drinkUntil), quantity: '1', status: 'IN_CELLAR', isFavorite: false,
    };
}

async function requestJson(url, headers, body, timeoutMs) {
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body), signal: AbortSignal.timeout(timeoutMs) });
    if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.error?.message || `Provider error ${response.status}`); }
    return response.json();
}

async function callProvider(agent, imageBase64, mimeType) {
    const options = { model: agent.model, timeoutMs: agent.timeoutMs || 20000 };
    if (agent.provider === 'gemini') {
        const model = options.model || 'gemini-2.5-flash';
        const data = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${agent.apiKey}`, { 'Content-Type': 'application/json' }, { contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 1500 } }, options.timeoutMs);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    if (agent.provider === 'claude') {
        const data = await requestJson('https://api.anthropic.com/v1/messages', { 'Content-Type': 'application/json', 'x-api-key': agent.apiKey, 'anthropic-version': '2023-06-01' }, { model: options.model || 'claude-3-5-sonnet-20241022', max_tokens: 1500, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } }, { type: 'text', text: PROMPT }] }] }, options.timeoutMs);
        return data.content?.[0]?.text || '';
    }
    const url = agent.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
    const model = options.model || (agent.provider === 'groq' ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'google/gemma-3-27b-it:free');
    const data = await requestJson(url, { 'Content-Type': 'application/json', Authorization: `Bearer ${agent.apiKey}` }, { model, max_tokens: 1500, messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }] }] }, options.timeoutMs);
    return data.choices?.[0]?.message?.content || '';
}

async function withRetry(agent, imageBase64, mimeType) {
    let lastError;
    for (let attempt = 0; attempt <= (agent.maxRetries ?? 1); attempt += 1) {
        try { return normalize(await callProvider(agent, imageBase64, mimeType)); }
        catch (error) { lastError = error; if (attempt < (agent.maxRetries ?? 1)) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt)); }
    }
    throw lastError;
}

const keyOf = (value) => value?.toString().trim().toLocaleLowerCase('ro-RO').normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
function aggregate(items) {
    const fields = ['name', 'producer', 'country', 'region', 'subregion', 'vintage', 'type', 'alcoholPercentage', 'bottleSize', 'grapeVarieties', 'agingPotential', 'servingTemperature', 'tastingNotes', 'foodPairing', 'estimatedValue', 'drinkFrom', 'drinkUntil'];
    const result = { quantity: '1', status: 'IN_CELLAR', isFavorite: false, fieldConfidence: {} };
    for (const field of fields) {
        const groups = new Map();
        for (const item of items) { const value = item.result[field]; if (!value && value !== 0) continue; const key = keyOf(value); const group = groups.get(key) || { value, score: 0, votes: 0 }; group.score += item.weight; group.votes += 1; groups.set(key, group); }
        const winner = [...groups.values()].sort((a, b) => b.score - a.score || b.votes - a.votes)[0];
        if (winner) { result[field] = winner.value; result.fieldConfidence[field] = Math.min(1, winner.score / items.reduce((sum, item) => sum + item.weight, 0)); }
    }
    const aromas = new Map();
    for (const item of items) for (const aroma of item.result.aromaProfile || []) { const key = keyOf(aroma); const current = aromas.get(key) || { value: aroma, score: 0 }; current.score += item.weight; aromas.set(key, current); }
    result.aromaProfile = [...aromas.values()].sort((a, b) => b.score - a.score).slice(0, 6).map((item) => item.value);
    result.ensembleConfidence = Object.values(result.fieldConfidence).reduce((sum, value) => sum + value, 0) / Math.max(1, Object.keys(result.fieldConfidence).length);
    return result;
}

export async function analyzeWineLabel(imageBase64, mimeType, provider, apiKey, options = {}) {
    if (!imageBase64 || imageBase64.length < 100 || !mimeType?.startsWith('image/')) throw new Error('Imagine invalidă');
    return withRetry({ provider, apiKey, maxRetries: options.maxRetries ?? 2, timeoutMs: options.timeoutMs || 20000 }, imageBase64, mimeType);
}

export async function analyzeWineLabelEnsemble(imageBase64, mimeType, agents = [], { providers = ENSEMBLE_DEFAULT_PROVIDERS, maxRetries = 1 } = {}) {
    if (!imageBase64 || imageBase64.length < 100 || !mimeType?.startsWith('image/')) throw new Error('Imagine invalidă');
    const configured = Array.isArray(agents) ? agents : Object.entries(agents).map(([provider, apiKey]) => ({ provider, apiKey }));
    const usable = configured.filter((agent) => agent.enabled !== false && agent.apiKey?.trim() && AI_PROVIDERS[agent.provider] && (!providers.length || providers.includes(agent.provider))).sort((a, b) => (a.priority || 0) - (b.priority || 0));
    if (!usable.length) throw new Error('Niciun agent AI activ și configurat');
    const settled = await Promise.allSettled(usable.map((agent) => withRetry({ ...agent, maxRetries: agent.maxRetries ?? maxRetries }, imageBase64, mimeType).then((result) => ({ result, weight: Number(agent.weight) > 0 ? Number(agent.weight) : 1 }))));
    const successful = settled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
    const errors = settled.map((item, index) => item.status === 'rejected' ? { provider: usable[index].provider, error: item.reason?.message || 'Eroare necunoscută' } : null).filter(Boolean);
    if (!successful.length) throw new Error(`Toți agenții au eșuat: ${errors.map((item) => item.provider).join(', ')}`);
    return { result: aggregate(successful), sources: settled.map((item, index) => item.status === 'fulfilled' ? usable[index].provider : null).filter(Boolean), errors };
}
