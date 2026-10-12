import { describe, expect, it, vi } from 'vitest';
import { dishFromPhotoPrompt, normalizeDish } from '@/utils/foodToWine';
import { generateWithAgents } from '@/utils/aiProviders';

describe('normalizeDish', () => {
  it('curăță numele felului și limitează încrederea', () => {
    expect(normalizeDish({ isFood: true, dish: '  miel  la cuptor ', confidence: 3 })).toEqual({ dish: 'miel la cuptor', confidence: 1 });
  });
  it('respinge pozele fără mâncare și răspunsurile goale', () => {
    expect(() => normalizeDish({ isFood: false })).toThrow(expect.objectContaining({ providerStatus: 'NOT_FOOD' }));
    expect(() => normalizeDish({ isFood: true, dish: '' })).toThrow(expect.objectContaining({ providerStatus: 'INVALID_RESULT' }));
  });
  it('promptul cere JSON în română', () => {
    expect(dishFromPhotoPrompt()).toContain('Romanian');
  });
});

describe('generateWithAgents cu imagine', () => {
  it('sare peste agenții fără imagini și trimite poza la cel care le acceptă', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ candidates: [{ content: { parts: [{ text: '{"isFood":true,"dish":"sarmale","confidence":0.9}' }] } }] }));
    vi.stubGlobal('fetch', fetchMock);
    const agents = [
      { id: 'text-only', provider: 'gemini', apiKey: 'k1', model: 'm1', priority: 0, capabilities: { imageInput: false } },
      { id: 'vision', provider: 'gemini', apiKey: 'k2', model: 'm2', priority: 1 },
    ];
    const { result, usage } = await generateWithAgents(agents, dishFromPhotoPrompt(), normalizeDish, { operation: 'dish_photo', image: { base64: 'x'.repeat(200), mimeType: 'image/jpeg' } });
    expect(result.dish).toBe('sarmale');
    expect(usage.map((u) => u.agentId)).toEqual(['vision']);
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(JSON.stringify(body)).toContain('inline_data');
    vi.unstubAllGlobals();
  });
});
