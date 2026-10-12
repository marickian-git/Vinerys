import { describe, expect, it, vi, afterEach } from 'vitest';
import { eventStreamResponse, formatEvent, parseEventChunk } from '@/utils/sse';
import { progressLabel, scanLabel } from '@/utils/scanClient';
import { analyzeWineLabelEnsemble } from '@/utils/aiProviders';

afterEach(() => vi.unstubAllGlobals());

describe('SSE', () => {
  it('parsează evenimente împărțite în bucăți arbitrare', () => {
    const text = formatEvent('progress', { stage: 'upload' }) + formatEvent('result', { status: 200, ok: true });
    const first = parseEventChunk(text.slice(0, 20));
    expect(first.events).toEqual([]);
    const second = parseEventChunk(first.rest + text.slice(20));
    expect(second.events).toEqual([{ event: 'progress', data: { stage: 'upload' } }, { event: 'result', data: { status: 200, ok: true } }]);
    expect(second.rest).toBe('');
  });

  it('eventStreamResponse trimite evenimentele și închide streamul', async () => {
    const response = eventStreamResponse(async (send) => { send('progress', { stage: 'enrich' }); send('result', { status: 200 }); });
    expect(response.headers.get('content-type')).toContain('text/event-stream');
    expect(response.headers.get('x-accel-buffering')).toBe('no');
    const { events } = parseEventChunk(await response.text());
    expect(events.map((e) => e.event)).toEqual(['progress', 'result']);
  });
});

describe('progressLabel', () => {
  it('etapele în română, cu numele agentului', () => {
    expect(progressLabel({ stage: 'identify', providers: ['gemini'] })).toBe('Gemini citește eticheta…');
    expect(progressLabel({ stage: 'identify', providers: ['gemini', 'groq'] })).toBe('Citesc eticheta cu 2 agenți AI…');
    expect(progressLabel({ stage: 'agent', provider: 'gemini', ok: true, name: 'Flamboyant' }, { done: 1 })).toBe('Gemini a identificat Flamboyant…');
    expect(progressLabel({ stage: 'agent', provider: 'groq', ok: true, name: 'Flamboyant' }, { done: 2 })).toBe('Groq confirmă: Flamboyant…');
    expect(progressLabel({ stage: 'consensus', agents: 2, confidence: 0.8 })).toBe('Consens între 2 agenți (80%)…');
  });
});

describe('scanLabel', () => {
  it('citește progresul din stream și întoarce rezultatul final', async () => {
    const response = eventStreamResponse(async (send) => {
      send('progress', { stage: 'upload' });
      send('progress', { stage: 'identify', providers: ['gemini'] });
      send('result', { status: 200, success: true, data: { name: 'Flamboyant' } });
    });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
    const labels = [];
    const { ok, result } = await scanLabel({ imageBase64: 'x', mimeType: 'image/jpeg' }, (label) => labels.push(label));
    expect(ok).toBe(true);
    expect(result.data.name).toBe('Flamboyant');
    expect(labels).toEqual(['Încarc poza…', 'Gemini citește eticheta…']);
    expect(fetch.mock.calls[0][1].headers.Accept).toContain('text/event-stream');
  });

  it('acceptă și răspunsul JSON (cache sau eroare înainte de scanare)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'Configurează un agent' }, { status: 400 })));
    const { ok, result } = await scanLabel({ imageBase64: 'x', mimeType: 'image/jpeg' });
    expect(ok).toBe(false);
    expect(result.error).toBe('Configurează un agent');
  });

  it('semnalează conexiunea întreruptă fără rezultat', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(eventStreamResponse(async (send) => send('progress', { stage: 'upload' }))));
    const { ok, result } = await scanLabel({ imageBase64: 'x', mimeType: 'image/jpeg' });
    expect(ok).toBe(false);
    expect(result.error).toMatch(/întrerupt/);
  });
});

describe('analyzeWineLabelEnsemble onProgress', () => {
  it('raportează identificarea, fiecare agent, consensul și îmbogățirea', async () => {
    const identity = { name: 'Flamboyant', producer: 'Davino', vintage: 2017, country: 'România', region: 'Dealu Mare', type: 'RED' };
    vi.stubGlobal('fetch', vi.fn().mockImplementation(async () => Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(identity) }] } }] })));
    const events = [];
    const agents = [
      { id: 'a', provider: 'gemini', apiKey: 'k1', model: 'm1', maxRetries: 0 },
      { id: 'b', provider: 'gemini', apiKey: 'k2', model: 'm2', maxRetries: 0 },
    ];
    await analyzeWineLabelEnsemble('x'.repeat(200), 'image/jpeg', agents, { providers: [], onProgress: (e) => events.push(e) });
    expect(events.map((e) => e.stage)).toEqual(['identify', 'agent', 'agent', 'consensus', 'enrich']);
    expect(events[1]).toMatchObject({ provider: 'gemini', ok: true, name: 'Flamboyant' });
    expect(events[3]).toMatchObject({ agents: 2, name: 'Flamboyant' });
  });
});
