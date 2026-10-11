import { afterEach, describe, expect, it, vi } from 'vitest';
import { estimateCostUsd, priceFor, resetPricingCache } from '@/utils/aiPricing';
import { readUsage } from '@/utils/aiProviders';

afterEach(() => {
  vi.unstubAllEnvs();
  resetPricingCache();
});

describe('readUsage', () => {
  it('citește tokenii de la Gemini, Anthropic și OpenAI-compatibil', () => {
    expect(readUsage({ usageMetadata: { promptTokenCount: 1200, candidatesTokenCount: 300 } })).toEqual({ inputTokens: 1200, outputTokens: 300 });
    expect(readUsage({ usage: { input_tokens: 900, output_tokens: 120 } })).toEqual({ inputTokens: 900, outputTokens: 120 });
    expect(readUsage({ usage: { prompt_tokens: 50, completion_tokens: 10 } })).toEqual({ inputTokens: 50, outputTokens: 10 });
    expect(readUsage({})).toEqual({ inputTokens: null, outputTokens: null });
  });
});

describe('priceFor / estimateCostUsd', () => {
  it('tier gratuit = 0', () => {
    expect(estimateCostUsd({ billingType: 'FREE_TIER', inputTokens: 1000, outputTokens: 100 })).toBe(0);
  });

  it('prețul din metadata agentului are prioritate', () => {
    expect(estimateCostUsd({ model: 'x', pricing: { input: 1, output: 4 }, inputTokens: 1_000_000, outputTokens: 500_000 })).toBe(3);
  });

  it('AI_PRICING_JSON: model exact sau cel mai lung prefix', () => {
    vi.stubEnv('AI_PRICING_JSON', JSON.stringify({ 'claude-': [3, 15], 'claude-haiku': [1, 5], 'gemini-2.5-flash': [0.3, 2.5] }));
    expect(priceFor({ model: 'claude-haiku-4' })).toEqual({ input: 1, output: 5 });
    expect(priceFor({ model: 'claude-sonnet-4' })).toEqual({ input: 3, output: 15 });
    expect(estimateCostUsd({ model: 'gemini-2.5-flash', inputTokens: 2000, outputTokens: 400 })).toBeCloseTo(0.0016, 6);
  });

  it('preț necunoscut sau tokeni lipsă → null', () => {
    expect(estimateCostUsd({ model: 'necunoscut', inputTokens: 10, outputTokens: 10 })).toBeNull();
    expect(estimateCostUsd({ billingType: 'FREE_TIER', inputTokens: null, outputTokens: 5 })).toBeNull();
  });

  it('JSON invalid în env nu aruncă', () => {
    vi.stubEnv('AI_PRICING_JSON', '{oops');
    expect(priceFor({ model: 'x' })).toBeNull();
  });
});
