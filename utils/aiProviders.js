const VALID_TYPES = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED'];
import { AI_PROVIDER_REGISTRY, getProviderDefinition } from './aiProviderRegistry';
import { validateProviderBaseUrl } from './aiUrlSecurity';
const CURRENT_YEAR = new Date().getFullYear();
const IDENTIFICATION_PROMPT = `You are identifying a wine from a label image. Return only valid JSON.
Focus on what is visible or strongly supported by the label. Do not guess missing facts.
Return exactly these keys: name, producer, country, region, subregion, appellation, vintage, type, color, grapeVarieties, alcoholPercentage, bottleSize, labelText, confidence, evidence.
confidence must contain identity (0..1) and per-field confidence values. evidence must contain short label evidence for important fields.
Use null for unknown scalar values and [] for unknown arrays. vintage must be null unless a year is readable. type must be RED, WHITE, ROSE, SPARKLING, DESSERT, or FORTIFIED; color must be RED, WHITE, ROSE, or ORANGE. Do not invent text or enrichment.`;

const ENRICHMENT_PROMPT = (identity) => `You are enriching a wine record after label identification. Use only the identity below and reliable general wine knowledge. Clearly distinguish specific knowledge from an estimate.
Identity: ${JSON.stringify(identity)}
Return only valid JSON with exactly these keys: tastingNotes, aromaProfile, foodPairing, servingTemperature, agingPotential, estimatedValue, drinkFrom, drinkUntil, drinkWindowConfidence, drinkWindowBasis, enrichmentConfidence, enrichmentBasis.
Prioritize drinkFrom and drinkUntil. They are calendar years, not ages. Consider exact wine, producer, cuvee, vintage, region/appellation, grapes, style, structure, tannin, acidity, residual sugar, winemaking and reputation in that order. Do not use a generic grape rule when more specific information is available.
If vintage is null, drinkFrom and drinkUntil must be null. If a specific value is not supported, return null instead of inventing it. estimatedValue must be null unless producer, wine, vintage and market level support a defensible estimate.
agingPotential is distinct from the drinking window. tastingNotes must say whether they are SPECIFIC or INFERRED in the text. aromaProfile must contain at most 8 concise aromas. foodPairing must be a short array. drinkWindowBasis must be one of EXACT_WINE, PRODUCER_AND_VINTAGE, REGION_AND_STYLE, GRAPE_AND_STYLE, GENERIC_ESTIMATE, or UNKNOWN.`;

export const AI_PROVIDERS = AI_PROVIDER_REGISTRY;

export const ENSEMBLE_DEFAULT_PROVIDERS = ['gemini', 'groq', 'openrouter'];

function parseJson(raw) {
    const text = typeof raw === 'string' ? raw.replace(/```json|```/gi, '').trim() : JSON.stringify(raw);
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Răspunsul AI nu conține JSON');
    return JSON.parse(match[0]);
}

function asNumber(value) {
    if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return null;
    return Number(value);
}

function normalizeIdentification(raw) {
    const vintage = Number.parseInt(raw.vintage, 10);
    const year = Number.isInteger(vintage) && vintage >= 1800 && vintage <= CURRENT_YEAR ? vintage : null;
    return {
        name: raw.name?.toString().trim() || null, producer: raw.producer?.toString().trim() || null, country: raw.country?.toString().trim() || null,
        region: raw.region?.toString().trim() || null, subregion: raw.subregion?.toString().trim() || null, appellation: raw.appellation?.toString().trim() || null,
        vintage: year, type: VALID_TYPES.includes(raw.type) ? raw.type : null, color: ['RED', 'WHITE', 'ROSE', 'ORANGE'].includes(raw.color) ? raw.color : null,
        alcoholPercentage: asNumber(raw.alcoholPercentage), bottleSize: raw.bottleSize?.toString().trim() || null,
        grapeVarieties: Array.isArray(raw.grapeVarieties) ? raw.grapeVarieties.filter(Boolean).slice(0, 8) : [],
        labelText: raw.labelText?.toString().trim() || null, confidence: raw.confidence || {}, evidence: raw.evidence || {},
    };
}

function hasUsefulIdentity(result) {
    return Boolean(result?.name || result?.producer);
}

function identityResultStatus(result) {
    if (!result || !hasUsefulIdentity(result)) return 'EMPTY';
    if (result.name && result.producer) return 'USEFUL';
    return 'PARTIAL';
}

function normalizeEnrichment(raw, identity) {
    const vintage = identity.vintage;
    const drinkFrom = vintage ? asNumber(raw.drinkFrom) : null;
    const drinkUntil = vintage ? asNumber(raw.drinkUntil) : null;
    const validYear = (value) => Number.isInteger(value) && value >= 1800 && value <= CURRENT_YEAR + 80 ? value : null;
    const from = validYear(drinkFrom);
    const until = validYear(drinkUntil);
    return {
        tastingNotes: raw.tastingNotes?.toString().trim() || null,
        aromaProfile: Array.isArray(raw.aromaProfile) ? raw.aromaProfile.filter(Boolean).slice(0, 8) : [],
        foodPairing: Array.isArray(raw.foodPairing) ? raw.foodPairing.filter(Boolean).slice(0, 8) : [],
        servingTemperature: raw.servingTemperature?.toString().trim() || null,
        agingPotential: raw.agingPotential?.toString().trim() || null,
        estimatedValue: asNumber(raw.estimatedValue),
        drinkFrom: from && (!until || from <= until) ? from : null,
        drinkUntil: until && (!from || until >= from) ? until : null,
        drinkWindowConfidence: Math.max(0, Math.min(1, asNumber(raw.drinkWindowConfidence) || 0)),
        drinkWindowBasis: ['EXACT_WINE', 'PRODUCER_AND_VINTAGE', 'REGION_AND_STYLE', 'GRAPE_AND_STYLE', 'GENERIC_ESTIMATE'].includes(raw.drinkWindowBasis) ? raw.drinkWindowBasis : 'UNKNOWN',
        enrichmentConfidence: Math.max(0, Math.min(1, asNumber(raw.enrichmentConfidence) || 0)),
        enrichmentBasis: raw.enrichmentBasis?.toString().trim() || null,
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
        error.providerStatus = response.status === 429 ? 'RATE_LIMITED' : response.status === 408 ? 'TIMEOUT' : 'ERROR';
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
            imageInput: modalities.includes('image') || (agent.capabilities?.imageInput !== false && /vision|scout|pixtral|gemma-3|llama-4|qwen.*vl/i.test(model.id || '')),
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

async function callProviderWithModel(agent, prompt, imageBase64 = null, mimeType = null, modelOverride) {
    const options = { model: agent.model, timeoutMs: agent.timeoutMs || 20000 };
    if (process.env.NODE_ENV !== 'production') console.info('[ai-debug] request', { provider: agent.provider, model: modelOverride || options.model || null, vision: Boolean(imageBase64), mimeType: mimeType || null, imageBytes: imageBase64?.length || 0, prompt: prompt.slice(0, 180) });
    if (agent.provider === 'gemini') {
        const model = modelOverride || options.model || 'gemini-3.6-flash';
        const parts = [{ text: prompt }];
        if (imageBase64) parts.push({ inline_data: { mime_type: mimeType, data: imageBase64 } });
        const data = await requestJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${agent.apiKey}`, { 'Content-Type': 'application/json' }, { contents: [{ parts }], generationConfig: { temperature: 0.1, maxOutputTokens: 1800 } }, options.timeoutMs);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    if (agent.provider === 'claude') {
        const content = imageBase64 ? [{ type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } }, { type: 'text', text: prompt }] : [{ type: 'text', text: prompt }];
        const data = await requestJson('https://api.anthropic.com/v1/messages', { 'Content-Type': 'application/json', 'x-api-key': agent.apiKey, 'anthropic-version': '2023-06-01' }, { model: options.model || 'claude-3-5-sonnet-20241022', max_tokens: 1800, messages: [{ role: 'user', content }] }, options.timeoutMs);
        return data.content?.[0]?.text || '';
    }
    const definition = getProviderDefinition(agent.provider);
    const baseUrl = agent.baseUrl || definition.baseUrl;
    if (agent.provider === 'openai-compatible' || agent.providerType === 'custom') await validateProviderBaseUrl(baseUrl);
    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
    const model = modelOverride || options.model || '';
    if (!model) throw new Error('Modelul este obligatoriu pentru provider');
    if (!modelOverride && agent.provider !== 'openai-compatible' && getProviderDefinition(agent.provider).supportsModelDiscovery) {
        const discovered = await listProviderModels(agent);
        const selected = discovered.find((item) => item.id === model);
        if (selected && selected.imageInput === false) {
            const error = new Error(`Modelul ${model} nu acceptă imagini`);
            error.status = 422;
            error.providerStatus = 'MODEL_UNAVAILABLE';
            throw error;
        }
        if (!selected && discovered.length) {
            const error = new Error(`Modelul ${model} nu a fost găsit în discovery`);
            error.status = 404;
            error.providerStatus = 'MODEL_UNAVAILABLE';
            throw error;
        }
    }
    const content = [{ type: 'text', text: prompt }];
    if (imageBase64) content.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } });
    const data = await requestJson(url, { 'Content-Type': 'application/json', Authorization: `Bearer ${agent.apiKey}` }, { model, max_tokens: 1800, messages: [{ role: 'user', content }] }, options.timeoutMs);
    return data.choices?.[0]?.message?.content || '';
}

async function callProvider(agent, prompt, imageBase64, mimeType) {
    try {
        return await callProviderWithModel(agent, prompt, imageBase64, mimeType);
    } catch (error) {
        if (error.status !== 404) throw error;
        try {
            const discoveredModel = await discoverVisionModel(agent);
            if (!discoveredModel || discoveredModel === agent.model) throw error;
            return await callProviderWithModel(agent, prompt, imageBase64, mimeType, discoveredModel);
        } catch (discoveryError) {
            throw error;
        }
    }
}

async function withRetry(agent, prompt, imageBase64, mimeType, normalizeResult) {
    let lastError;
    for (let attempt = 0; attempt <= (agent.maxRetries ?? 1); attempt += 1) {
        try {
            const raw = await callProvider(agent, prompt, imageBase64, mimeType);
            const parsed = parseJson(raw);
            const result = normalizeResult(parsed);
            return { raw, parsed, result, resultStatus: normalizeResult === normalizeIdentification ? identityResultStatus(result) : 'USEFUL' };
        } catch (error) {
            lastError = error;
            if (error.status === 429 || error.providerStatus === 'RATE_LIMITED') break;
            if (attempt < (agent.maxRetries ?? 1)) await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
        }
    }
    throw lastError;
}

const keyOf = (value) => value?.toString().trim().toLocaleLowerCase('ro-RO').normalize('NFD').replace(/[\u0300-\u036f]/g, '') || '';
function consensus(items, fields) {
    const result = {};
    const fieldConfidence = {};
    for (const field of fields) {
        const groups = new Map();
        for (const item of items) {
            const value = item.result[field];
            if (!value && value !== 0 && (!Array.isArray(value) || !value.length)) continue;
            const key = keyOf(Array.isArray(value) ? value.join('|') : value);
            const group = groups.get(key) || { value, score: 0, votes: 0 };
            group.score += item.weight;
            group.votes += 1;
            groups.set(key, group);
        }
        const winner = [...groups.values()].sort((a, b) => b.score - a.score || b.votes - a.votes)[0];
        if (winner) {
            result[field] = winner.value;
            fieldConfidence[field] = Math.min(1, winner.score / items.reduce((sum, item) => sum + item.weight, 0));
        } else {
            result[field] = Array.isArray(items[0]?.result[field]) ? [] : null;
            fieldConfidence[field] = 0;
        }
    }
    return { result, fieldConfidence };
}

function chooseEnrichment(items) {
    const basisRank = { EXACT_WINE: 5, PRODUCER_AND_VINTAGE: 4, REGION_AND_STYLE: 3, GRAPE_AND_STYLE: 2, GENERIC_ESTIMATE: 1, UNKNOWN: 0 };
    const ordered = [...items].sort((a, b) => (basisRank[b.result.drinkWindowBasis] - basisRank[a.result.drinkWindowBasis]) || (b.result.drinkWindowConfidence - a.result.drinkWindowConfidence) || (b.weight - a.weight));
    const best = ordered[0]?.result || {};
    const result = { ...best };
    const confidence = Math.max(0, Math.min(1, best.drinkWindowConfidence || 0));
    return {
        ...result,
        drinkWindowConfidence: result.drinkFrom && result.drinkUntil ? confidence : 0,
        enrichmentConfidence: Math.max(0, Math.min(1, best.enrichmentConfidence || 0)),
        enrichmentProvider: ordered[0]?.provider || null,
    };
}

export async function analyzeWineLabel(imageBase64, mimeType, provider, apiKey, options = {}) {
    if (!imageBase64 || imageBase64.length < 100 || !mimeType?.startsWith('image/')) throw new Error('Imagine invalidă');
    const response = await withRetry({ provider, apiKey, maxRetries: options.maxRetries ?? 2, timeoutMs: options.timeoutMs || 20000 }, IDENTIFICATION_PROMPT, imageBase64, mimeType, normalizeIdentification);
    return response.result;
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
    const settled = await Promise.allSettled(usable.map((agent) => withRetry({ ...agent, maxRetries: agent.maxRetries ?? maxRetries }, IDENTIFICATION_PROMPT, imageBase64, mimeType, normalizeIdentification).then((response) => ({ ...response, agent, provider: agent.provider, weight: Number(agent.weight) > 0 ? Number(agent.weight) : 1 }))));
    const responses = settled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
    const successful = responses.filter((item) => item.resultStatus !== 'EMPTY');
    const emptyResults = responses.filter((item) => item.resultStatus === 'EMPTY').map((item) => ({ agentId: item.agent.id || null, provider: item.provider, model: item.agent.model || null, providerStatus: 'SUCCESS', resultStatus: 'EMPTY', raw: item.raw, parsed: item.parsed, normalized: item.result }));
    const errors = settled.map((item, index) => item.status === 'rejected' ? {
        agentId: usable[index].id || null,
        provider: usable[index].provider,
        model: usable[index].model || null,
        httpStatus: item.reason?.status || null,
        providerStatus: item.reason?.providerStatus || (item.reason?.status === 429 ? 'RATE_LIMITED' : item.reason?.name === 'TimeoutError' ? 'TIMEOUT' : 'ERROR'),
        resultStatus: 'INVALID',
        error: item.reason?.message || 'Eroare necunoscută',
    } : null).filter(Boolean);
    const providerDebug = [...responses.map((item) => ({ provider: item.provider, model: item.agent.model || null, httpStatus: 200, providerStatus: 'SUCCESS', resultStatus: item.resultStatus, raw: item.raw, parsed: item.parsed, normalized: item.result })), ...errors];
    if (process.env.NODE_ENV !== 'production') console.info('[ai-debug] provider pipeline', JSON.stringify(providerDebug));
    if (!successful.length) {
        const error = new Error('IDENTIFICATION_FAILED: niciun provider nu a returnat o identificare utilă');
        error.providerErrors = [...errors, ...emptyResults];
        throw error;
    }

    const identityFields = ['name', 'producer', 'country', 'region', 'subregion', 'vintage', 'type', 'color', 'grapeVarieties', 'alcoholPercentage', 'bottleSize'];
    const identity = consensus(successful, identityFields);
    const identityConfidence = Object.entries(identity.fieldConfidence).filter(([field]) => ['name', 'producer', 'vintage', 'country', 'region'].includes(field)).reduce((sum, [, value]) => sum + value, 0) / 5;
    const hasIdentity = Boolean(identity.result.name || identity.result.producer);
    const enrichmentSettled = hasIdentity ? await Promise.allSettled(successful.map((item) => withRetry({ ...item.agent, maxRetries: item.agent.maxRetries ?? maxRetries }, ENRICHMENT_PROMPT(identity.result), null, null, (raw) => normalizeEnrichment(raw, identity.result)).then((response) => ({ ...response, provider: item.provider, weight: item.weight })))) : [];
    const enrichments = enrichmentSettled.filter((item) => item.status === 'fulfilled').map((item) => item.value);
    const enrichment = chooseEnrichment(enrichments);
    const result = {
        ...identity.result,
        ...enrichment,
        grapeVarieties: identity.result.grapeVarieties || [],
        foodPairing: enrichment.foodPairing || [],
        aromaProfile: enrichment.aromaProfile || [],
        quantity: '1',
        status: 'IN_CELLAR',
        isFavorite: false,
        confidence: { identity: Number(identityConfidence.toFixed(2)), drinkWindow: enrichment.drinkWindowConfidence || 0, overall: Number(((identityConfidence + (enrichment.enrichmentConfidence || 0)) / 2).toFixed(2)) },
        evidence: identity.result.evidence,
        unknown: identityFields.filter((field) => identity.result[field] === null || (Array.isArray(identity.result[field]) && !identity.result[field].length)),
        identification: { confidence: Number(identityConfidence.toFixed(2)), fieldConfidence: identity.fieldConfidence, evidence: identity.result.evidence },
        enrichment: { confidence: enrichment.enrichmentConfidence || 0, basis: enrichment.enrichmentBasis || null, provider: enrichment.enrichmentProvider },
    };
    return {
        result,
        sources: successful.map((item) => item.provider),
        successfulAgentIds: successful.map((item) => item.agent.id).filter(Boolean),
        errors: [...errors, ...emptyResults],
        enrichmentErrors: enrichmentSettled.filter((item) => item.status === 'rejected').map((item, index) => ({ provider: successful[index].provider, providerStatus: item.reason?.providerStatus || 'ERROR', error: item.reason?.message || 'Enrichment failed' })),
        providerDebug,
        emptyResults,
    };
}
