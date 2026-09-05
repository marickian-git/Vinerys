const OPENAI_COMPATIBLE = {
  adapter: 'openai-compatible',
  authType: 'bearer',
  capabilities: { imageInput: true, structuredOutput: true },
  supportsModelDiscovery: true,
};

export const AI_PROVIDER_REGISTRY = {
  gemini: {
    id: 'gemini', name: 'Google Gemini', type: 'preset', adapter: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta', authType: 'query-key',
    billingType: 'UNKNOWN', capabilities: { imageInput: true, structuredOutput: true }, supportsModelDiscovery: true,
  },
  groq: {
    id: 'groq', name: 'Groq', type: 'preset', baseUrl: 'https://api.groq.com/openai/v1',
    billingType: 'UNKNOWN', ...OPENAI_COMPATIBLE,
  },
  openrouter: {
    id: 'openrouter', name: 'OpenRouter', type: 'preset', baseUrl: 'https://openrouter.ai/api/v1',
    billingType: 'UNKNOWN', ...OPENAI_COMPATIBLE,
  },
  claude: {
    id: 'claude', name: 'Anthropic Claude', type: 'preset', adapter: 'anthropic',
    baseUrl: 'https://api.anthropic.com/v1', authType: 'x-api-key', billingType: 'PAID',
    capabilities: { imageInput: true, structuredOutput: true }, supportsModelDiscovery: false,
  },
  deepseek: {
    id: 'deepseek', name: 'DeepSeek', type: 'preset', baseUrl: 'https://api.deepseek.com/v1',
    billingType: 'PAID', ...OPENAI_COMPATIBLE,
    capabilities: { imageInput: false, structuredOutput: true },
  },
  zai: {
    id: 'zai', name: 'Z.ai / GLM', type: 'preset', baseUrl: 'https://api.z.ai/api/paas/v4',
    billingType: 'UNKNOWN', ...OPENAI_COMPATIBLE,
  },
  openai: {
    id: 'openai', name: 'OpenAI', type: 'preset', baseUrl: 'https://api.openai.com/v1',
    billingType: 'PAID', ...OPENAI_COMPATIBLE,
  },
  mistral: {
    id: 'mistral', name: 'Mistral AI', type: 'preset', baseUrl: 'https://api.mistral.ai/v1',
    billingType: 'PAID', ...OPENAI_COMPATIBLE,
  },
  cerebras: {
    id: 'cerebras', name: 'Cerebras', type: 'preset', baseUrl: 'https://api.cerebras.ai/v1',
    billingType: 'UNKNOWN', ...OPENAI_COMPATIBLE,
  },
  together: {
    id: 'together', name: 'Together AI', type: 'preset', baseUrl: 'https://api.together.xyz/v1',
    billingType: 'PAID', ...OPENAI_COMPATIBLE,
  },
  fireworks: {
    id: 'fireworks', name: 'Fireworks AI', type: 'preset', baseUrl: 'https://api.fireworks.ai/inference/v1',
    billingType: 'PAID', ...OPENAI_COMPATIBLE,
  },
  'openai-compatible': {
    id: 'openai-compatible', name: 'OpenAI-compatible', type: 'custom',
    authType: 'bearer', billingType: 'UNKNOWN', ...OPENAI_COMPATIBLE,
  },
};

export function getProviderDefinition(provider) {
  return AI_PROVIDER_REGISTRY[provider] || AI_PROVIDER_REGISTRY['openai-compatible'];
}

export function listProviderDefinitions() {
  return Object.values(AI_PROVIDER_REGISTRY).map(({ adapter, ...provider }) => ({
    ...provider,
    adapter: adapter || provider.id,
  }));
}

export function isKnownProvider(provider) {
  return Boolean(AI_PROVIDER_REGISTRY[provider]);
}