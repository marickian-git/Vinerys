import { describe, expect, it, vi } from 'vitest';
import { normalizePairing, pairingKey, pairingPrompt } from '@/utils/pairing';
import { generateWithAgents } from '@/utils/aiProviders';

const wine = { name: 'Flamboyant', producer: 'Davino', vintage: 2017, type: 'RED', grapeVarieties: ['Fetească Neagră'], country: 'România' };

describe('pairingKey', () => {
  it('se schimbă doar când se schimbă identitatea vinului', () => {
    expect(pairingKey({ ...wine, quantity: 1, rating: 5 })).toBe(pairingKey({ ...wine, quantity: 6 }));
    expect(pairingKey({ ...wine, vintage: 2018 })).not.toBe(pairingKey(wine));
  });
});

describe('pairingPrompt', () => {
  it('cere JSON în română și include datele vinului', () => {
    const prompt = pairingPrompt(wine);
    expect(prompt).toContain('Romanian');
    expect(prompt).toContain('Fetească Neagră');
  });
});

describe('normalizePairing', () => {
  it('curăță răspunsul și limitează valorile', () => {
    const out = normalizePairing({
      dishes: [{ name: ' Miel la cuptor ', why: 'Taninii' }, 'Sarmale', { name: 'Brânză maturată' }, { name: 'în plus' }],
      servingTemperature: { min: 19, max: 16 },
      decantMinutes: '45',
      glass: 'Bordeaux',
    });
    expect(out.dishes).toEqual([{ name: 'Miel la cuptor', why: 'Taninii' }, { name: 'Sarmale', why: '' }, { name: 'Brânză maturată', why: '' }]);
    expect(out.servingTemperature).toEqual({ min: 16, max: 19 });
    expect(out).toMatchObject({ decantMinutes: 45, glass: 'Bordeaux', tip: null });
  });

  it('respinge răspunsurile cu mai puțin de 3 preparate', () => {
    expect(() => normalizePairing({ dishes: ['Doar unul'] })).toThrow(/3 preparate/);
  });
});

describe('generateWithAgents', () => {
  it('trece la următorul agent când primul eșuează și raportează consumul', async () => {
    const answer = { dishes: ['A', 'B', 'C'], servingTemperature: { min: 8, max: 10 }, decantMinutes: 0 };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('quota', { status: 500 }))
      .mockResolvedValueOnce(new Response('quota', { status: 500 }))
      .mockResolvedValueOnce(Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(answer) }] } }], usageMetadata: { promptTokenCount: 300, candidatesTokenCount: 90 } }));
    vi.stubGlobal('fetch', fetchMock);
    const agents = [
      { id: 'a1', provider: 'gemini', apiKey: 'k1', model: 'm1', priority: 0, maxRetries: 1 },
      { id: 'a2', provider: 'gemini', apiKey: 'k2', model: 'm2', priority: 1, maxRetries: 0 },
    ];
    const { result, usage } = await generateWithAgents(agents, 'prompt', normalizePairing, { operation: 'pairing' });
    expect(result.dishes.map((d) => d.name)).toEqual(['A', 'B', 'C']);
    expect(usage.map((u) => [u.agentId, u.success])).toEqual([['a1', false], ['a2', true]]);
    expect(usage[1]).toMatchObject({ operation: 'pairing', inputTokens: 300, outputTokens: 90 });
    vi.unstubAllGlobals();
  });
});
