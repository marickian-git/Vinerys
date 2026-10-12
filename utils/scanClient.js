// AI-009: scanarea etichetei cu progres live (SSE). Dacă serverul răspunde cu JSON (cache, erori de
// validare/cotă), rezultatul e același; `onProgress` primește doar textul etapei curente.
import { appPath } from './appPath';
import { parseEventChunk } from './sse';
import { AI_PROVIDER_REGISTRY } from './aiProviderRegistry';

const providerName = (id) => AI_PROVIDER_REGISTRY[id]?.name?.replace(/^(Google|Anthropic)\s+/, '') ?? id;

export function progressLabel(event, state = { done: 0 }) {
  switch (event.stage) {
    case 'upload': return 'Încarc poza…';
    case 'identify': return event.providers.length > 1 ? `Citesc eticheta cu ${event.providers.length} agenți AI…` : `${providerName(event.providers[0])} citește eticheta…`;
    case 'agent':
      if (!event.ok) return `${providerName(event.provider)} nu a reușit, aștept ceilalți agenți…`;
      return state.done > 1 ? `${providerName(event.provider)} confirmă${event.name ? `: ${event.name}` : ''}…` : `${providerName(event.provider)} a identificat${event.name ? ` ${event.name}` : ' vinul'}…`;
    case 'consensus': return event.agents > 1 ? `Consens între ${event.agents} agenți (${Math.round(event.confidence * 100)}%)…` : 'Verific identificarea…';
    case 'enrich': return 'Caut fereastra de consum și asocierile…';
    default: return null;
  }
}

export async function scanLabel({ imageBase64, mimeType }, onProgress = () => {}) {
  const response = await fetch(appPath('/api/ai-scan'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream, application/json' },
    body: JSON.stringify({ imageBase64, mimeType }),
  });
  if (!response.headers.get('content-type')?.includes('text/event-stream') || !response.body) {
    const result = await response.json().catch(() => ({ error: 'Răspuns invalid de la server' }));
    return { ok: response.ok && !result.error, result };
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  const state = { done: 0 };
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    const { events, rest } = parseEventChunk(buffer + value);
    buffer = rest;
    for (const { event, data } of events) {
      if (event === 'result') {
        const { status, ...result } = data;
        return { ok: status < 400 && !result.error, result };
      }
      if (data.stage === 'agent' && data.ok) state.done += 1;
      const label = progressLabel(data, state);
      if (label) onProgress(label, data);
    }
  }
  return { ok: false, result: { error: 'Conexiunea s-a întrerupt înainte de rezultat. Încearcă din nou.' } };
}
