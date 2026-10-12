import { describe, expect, it } from 'vitest';
import { chooseAgents, platformAgents, quotaFor, quotaMessage } from '@/utils/platformAI';

describe('platformAgents', () => {
  it('citește agenții din env și ignoră intrările incomplete sau JSON-ul invalid', () => {
    const env = { PLATFORM_AI_AGENTS: JSON.stringify([{ provider: 'gemini', model: 'g', apiKey: 'k' }, { provider: 'groq' }]) };
    expect(platformAgents(env)).toEqual([expect.objectContaining({ provider: 'gemini', apiKey: 'k', source: 'platform', priority: 0 })]);
    expect(platformAgents({ PLATFORM_AI_AGENTS: '{oops' })).toEqual([]);
    expect(platformAgents({})).toEqual([]);
  });
});

describe('quotaFor', () => {
  it('implicit, din env, nelimitat pentru admin', () => {
    expect(quotaFor({ role: 'USER' }, 'scan', {})).toBe(20);
    expect(quotaFor({ role: 'USER' }, 'text', { AI_QUOTA_TEXT: '5' })).toBe(5);
    expect(quotaFor({ role: 'ADMIN' }, 'scan', {})).toBe(Infinity);
  });
});

describe('chooseAgents', () => {
  const own = [{ provider: 'gemini' }];
  const platform = [{ provider: 'gemini', source: 'platform' }];
  it('cheile proprii au prioritate și nu consumă cotă', () => {
    expect(chooseAgents({ ownAgents: own, platform, used: 999, quota: 1 })).toEqual({ agents: own, source: 'byo' });
  });
  it('platforma, cât mai e cotă', () => {
    expect(chooseAgents({ ownAgents: [], platform, used: 3, quota: 20 }).source).toBe('platform');
    expect(chooseAgents({ ownAgents: [], platform, used: 20, quota: 20 })).toEqual({ error: 'QUOTA_EXCEEDED' });
    expect(chooseAgents({ ownAgents: [], platform: [], used: 0, quota: 20 })).toEqual({ error: 'NO_AGENTS' });
  });
  it('mesaje pentru utilizator', () => {
    expect(quotaMessage('QUOTA_EXCEEDED', 20)).toContain('20 cereri');
    expect(quotaMessage('NO_AGENTS')).toContain('Setări');
  });
});

describe('consumul pe cheile platformei', () => {
  it('generateWithAgents marchează consumul cu sursa agentului', async () => {
    const { vi } = await import('vitest');
    const { generateWithAgents } = await import('@/utils/aiProviders');
    const { normalizePairing } = await import('@/utils/pairing');
    const answer = { dishes: ['A', 'B', 'C'] };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }] })));
    const [agent] = platformAgents({ PLATFORM_AI_AGENTS: JSON.stringify([{ provider: 'gemini', model: 'g', apiKey: 'k' }]) });
    const { usage } = await generateWithAgents([agent], 'p', normalizePairing, { operation: 'pairing' });
    expect(usage[0]).toMatchObject({ source: 'platform', agentId: null, success: true });
    vi.unstubAllGlobals();
  });
});
