import { afterEach, describe, expect, it, vi } from 'vitest';
import { createLogger, maskEmail, redact, requestIdFrom, serializeError } from '@/utils/logger';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe('redact', () => {
  it('ascunde cheile secrete la orice nivel', () => {
    const out = redact({
      apiKey: 'sk-123',
      nested: { password: 'x', encryptedApiKey: 'y', accessToken: 'z', imageBase64: 'AAAA' },
      list: [{ authorization: 'Bearer abc' }],
    });
    expect(out.apiKey).toBe('[redacted]');
    expect(out.nested).toEqual({ password: '[redacted]', encryptedApiKey: '[redacted]', accessToken: '[redacted]', imageBase64: '[redacted]' });
    expect(out.list[0].authorization).toBe('[redacted]');
  });

  it('păstrează metricile care conțin „token” în nume', () => {
    expect(redact({ inputTokens: 120, outputTokens: 40 })).toEqual({ inputTokens: 120, outputTokens: 40 });
  });

  it('maschează emailurile din texte', () => {
    expect(maskEmail('user john.doe@example.com a cerut')).toBe('user j***@example.com a cerut');
    expect(redact({ msg: 'ana@x.ro' }).msg).toBe('a***@x.ro');
  });

  it('taie textele foarte lungi', () => {
    expect(redact('a'.repeat(5000)).length).toBeLessThan(2100);
  });
});

describe('serializeError', () => {
  it('păstrează codul și statusul, fără stack în producție', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const error = Object.assign(new Error('boom for a@b.co'), { status: 429, code: 'RATE' });
    expect(serializeError(error)).toEqual({ name: 'Error', message: 'boom for a***@b.co', code: 'RATE', status: 429 });
  });
});

describe('createLogger', () => {
  it('scrie JSON în producție, cu câmpurile din child', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    createLogger('test').child({ requestId: 'r1' }).info('hello', { apiKey: 'secret', n: 1 });
    const entry = JSON.parse(spy.mock.calls[0][0]);
    expect(entry).toMatchObject({ level: 'info', scope: 'test', msg: 'hello', requestId: 'r1', apiKey: '[redacted]', n: 1 });
  });

  it('respectă LOG_LEVEL', () => {
    vi.stubEnv('LOG_LEVEL', 'warn');
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const logger = createLogger('test');
    logger.info('ignored');
    logger.warn('kept');
    expect(log).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledOnce();
  });
});

describe('requestIdFrom', () => {
  it('refolosește x-request-id valid, altfel generează unul', () => {
    expect(requestIdFrom(new Headers({ 'x-request-id': 'abc-123456' }))).toBe('abc-123456');
    expect(requestIdFrom(new Headers({ 'x-request-id': 'bad id!' }))).toMatch(/^[0-9a-f-]{36}$/);
  });
});
