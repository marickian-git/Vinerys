const VALID_TYPES = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED'];
import { AI_PROVIDER_REGISTRY, getProviderDefinition } from './aiProviderRegistry';
import { validateProviderBaseUrl } from './aiUrlSecurity';
const CURRENT_YEAR = new Date().getFullYear();
const PROMPT = `Read this wine label image. Return only valid JSON with these keys: name, producer, country, region, subregion, vintage, type, alcoholPercentage, bottleSize, grapeVarieties, agingPotential, servingTemperature, tastingNotes, foodPairing, estimatedValue, aromaProfile, drinkFrom, drinkUntil. Use null for unknown values. type must be RED, WHITE, ROSE, SPARKLING, DESSERT, or FORTIFIED. Do not invent text visible on the label.`;

export const AI_PROVIDERS = AI_PROVIDER_REGISTRY;

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

async function requestJson(url, headers, body, timeoutMs, method = 'POST') {
    const response = await fetch(url, {
        method,
        headers,
        ...(method === 'GET' ? {} : { body: JSON.stringify(body) }),
        redirect: 'manual',
        signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
        const responseText = await response.text().catch(() => '');
        let errorMessage = '';
        try {
            const error = JSON.parse(responseText);
            errorMessage = error.error?.message || error.message || '';
        } catch {
            errorMessage = responseText.replace(/\s+/g, ' ').trim();
        }
        const error = new Error(`${response.status}: ${errorMessage || 'răspuns invalid de la provider'}`);
        error.status = response.status;
        throw error;
    }
    return response.json();
}

export async function listProviderModels(agent) {
    const headers = { 'Content-Type': 'application/json' };
    if (agent.provider === 'gemini') {
        const data = await requestJson(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${agent.apiKey}`,
            headers,
            null,
            agent.timeoutMs || 20000,
            'GET',
        );
        return (data.models || []).map((model) => ({
            id: model.name?.replace(/^models\//, ''),
            name: model.displayName || model.name,
            imageInput: model.supportedGenerationMethods?.includes('generateContent') && /flash|pro|vision/i.test(model.name || ''),
            structuredOutput: true,
        })).filter((model) => model.id);
    }

    const definition = getProviderDefinition(agent.provider);
    const baseUrl = agent.baseUrl || definition.baseUrl;
    if (agent.provider === 'openai-compatible' || agent.providerType === 'custom') await validateProviderBaseUrl(baseUrl);
    const url = `${baseUrl.replace(/\/$/, '')}/models`;
    const data = await requestJson(url, { ...headers, Authorization: `Bearer ${agent.apiKey}` }, null, agent.timeoutMs || 20000, 'GET');
    return (data.data || []).map((model) => {
        const modalities = model.architecture?.input_modalities || model.input_modalities || [];
        return {
            id: model.id,
            name: model.name || model.id,
            imageInput: modalities.includes('image') || (agent.capabilities?.imageInput !== false && /vision|scout|pixtral|gemma-3/i.test(model.id || '')),
            structuredOutput: true,
            billingType: model.pricing ? 'PAID' : 'UNKNOWN',
        };
    }).filter((model) => model.id);
}

async function discoverVisionModel(agent) {
    const models = await listProviderModels(agent);
    return models
        .filter((model) => model.imageInput)
        .sort((a, b) => a.id.localeCompare(b.id))
        .map((model) => model.id)
        .find(Boolean);
}

async function callProviderWithModel(agent, imageBase64, mimeType, modelOverride) {
    const options = { model: agent.model, timeoutMs: agent.timeoutMs || 20000 };
    if (agent.provider === 'gemini') {
        const model = modelOverride || options.model || 'gemini-3.6-flash';
        const data = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${agent.apiKey}`, { 'Content-Type': 'application/json' }, { contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType, data: imageBase64 } }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 1500 } }, options.timeoutMs);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    if (agent.provider === 'claude') {
        const data = await requestJson('https://api.anthropic.com/v1/messages', { 'Content-Type': 'application/json', 'x-api-key': agent.apiKey, 'anthropic-version': '2023-06-01' }, { model: options.model || 'claude-3-5-sonnet-20241022', max_tokens: 1500, messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } }, { type: 'text', text: PROMPT }] }] }, options.timeoutMs);
        return data.content?.[0]?.text || '';
    }
    const definition = getProviderDefinition(agent.provider);
    const baseUrl = agent.baseUrl || definition.baseUrl;
    if (agent.provider === 'openai-compatible' || agent.providerType === 'custom') await validateProviderBaseUrl(baseUrl);
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    const model = modelOverride || options.model || '';
    if (!model) throw new Error('Modelul este obligatoriu pentru provider');
    const data = await requestJson(url, { 'Content-Type': 'application/json', Authorization: `Bearer ${agent.apiKey}` }, { model, max_tokens: 1500, messages: [{ role: 'user', content: [{ type: 'text', text: PROMPT }, { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } }] }] }, options.timeoutMs);
    return data.choices?.[0]?.message?.content || '';
}

async function callProvider(agent, imageBase64, mimeType) {
    try {
        return await callProviderWithModel(agent, imageBase64, mimeType);
    } catch (error) {
        if (error.status !== 404) throw error;
        try {
            const discoveredModel = await discoverVisionModel(agent);
            if (!discoveredModel || discoveredModel === agent.model) throw error;
            return await callProviderWithModel(agent, imageBase64, mimeType, discoveredModel);
        } catch (discoveryError) {
            throw error;
        }
    }
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
    const usable = configured.filter((agent) => {
        const definition = getProviderDefinition(agent.provider);
        const capabilities = agent.capabilities || definition.capabilities || {};
        return agent.enabled !== false && !['Model unavailable', 'Invalid credentials'].includes(agent.lastStatus) && agent.apiKey?.trim() &&
            AI_PROVIDERS[agent.provider] && capabilities.imageInput !== false &&
            (!providers.length || providers.includes(agent.provider));
    }).sort((a, b) => (a.priority || 0) - (b.priority || 0));
    if (!usable.length) throw new Error('Niciun agent AI activ și configurat');
    const settled = await Promise.allSettled(usable.map((agent) => withRetry({ ...agent, maxRetries: agent.maxRetries ?? maxRetries }, imageBase64, mimeType).then((result) => ({ result, weight: Number(agent.weight) > 0 ? Number(agent.weight) : 1 }))));
    const successful = settled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
    const errors = settled.map((item, index) => item.status === 'rejected' ? {
        agentId: usable[index].id || null,
        provider: usable[index].provider,
        model: usable[index].model || null,
        error: item.reason?.message || 'Eroare necunoscută',
    } : null).filter(Boolean);
    if (!successful.length) {
        const error = new Error(`Toți agenții au eșuat: ${errors.map((item) => item.provider).join(', ')}`);
        error.providerErrors = errors;
        throw error;
    }
    return {
        result: aggregate(successful),
        sources: settled.map((item, index) => item.status === 'fulfilled' ? usable[index].provider : null).filter(Boolean),
        successfulAgentIds: settled.map((item, index) => item.status === 'fulfilled' ? usable[index].id : null).filter(Boolean),
        errors,
    };
}
