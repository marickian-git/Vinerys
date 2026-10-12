import { describe, expect, it, vi } from 'vitest';
import { buildEvent, parseDsn, reportError } from '@/utils/errorReporting';

describe('parseDsn', () => {
  it('Sentry și GlitchTip (cu prefix de cale)', () => {
    expect(parseDsn('https://abc123@o1.ingest.sentry.io/42')).toEqual({ key: 'abc123', envelopeUrl: 'https://o1.ingest.sentry.io/api/42/envelope/' });
    expect(parseDsn('https://k@glitchtip.casa.ro/gt/7')).toEqual({ key: 'k', envelopeUrl: 'https://glitchtip.casa.ro/gt/api/7/envelope/' });
    expect(parseDsn('nu e url')).toBeNull();
    expect(parseDsn('https://fara-cheie.io/1')).toBeNull();
  });
});

describe('buildEvent', () => {
  it('redactează secretele și emailurile, păstrează stack-ul', () => {
    const event = buildEvent(new Error('eșec pentru ana@x.ro'), { tags: { apiKey: 'sk-1' }, extra: { password: 'p', wineId: 'w1' } });
    expect(event.exception.values[0].value).toBe('eșec pentru a***@x.ro');
    expect(event.tags.apiKey).toBe('[redacted]');
    expect(event.extra).toEqual({ password: '[redacted]', wineId: 'w1' });
    expect(event.exception.values[0].stacktrace.frames.length).toBeGreaterThan(0);
    expect(event.event_id).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('reportError', () => {
  it('nu face nimic fără DSN', async () => {
    const fetchImpl = vi.fn();
    expect(await reportError(new Error('x'), {}, { dsn: '', fetchImpl })).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('trimite un envelope cu autentificarea Sentry', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    expect(await reportError(new Error('boom'), { level: 'warning' }, { dsn: 'https://key1@sentry.example/5', fetchImpl })).toBe(true);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('https://sentry.example/api/5/envelope/');
    expect(init.headers['X-Sentry-Auth']).toContain('sentry_key=key1');
    const [, item, event] = init.body.split('\n').map((line) => JSON.parse(line));
    expect(item.type).toBe('event');
    expect(event).toMatchObject({ level: 'warning', exception: { values: [{ value: 'boom' }] } });
  });

  it('o eroare de rețea nu aruncă', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    expect(await reportError(new Error('x'), {}, { dsn: 'https://k@s.io/1', fetchImpl })).toBe(false);
  });
});
