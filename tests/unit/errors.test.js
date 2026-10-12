import { describe, expect, it, vi } from 'vitest';
import { AppError, actionError, forbidden, rateLimited, toPublicError, validationError, withApiHandler } from '@/utils/errors';

describe('AppError', () => {
  it('mapează codul la status și mesaj public', () => {
    const error = forbidden();
    expect(error).toMatchObject({ code: 'FORBIDDEN', status: 403, userMessage: 'Acces interzis' });
    expect(new AppError('NECUNOSCUT').code).toBe('INTERNAL');
  });
});

describe('toPublicError', () => {
  it('nu expune mesajul tehnic al erorilor neprevăzute', () => {
    const { status, body } = toPublicError(new Error('SELECT * FROM user failed'), 'req-1');
    expect(status).toBe(500);
    expect(body).toEqual({ error: expect.not.stringContaining('SELECT'), code: 'INTERNAL', requestId: 'req-1' });
  });

  it('include detaliile de validare', () => {
    const { status, body } = toPublicError(validationError({ name: ['Obligatoriu'] }));
    expect(status).toBe(400);
    expect(body.details).toEqual({ name: ['Obligatoriu'] });
  });
});

describe('actionError', () => {
  it('întoarce detaliile pentru formulare și loghează doar erorile neprevăzute', () => {
    const log = { error: vi.fn() };
    expect(actionError(validationError({ name: ['x'] }), log)).toEqual({ error: { name: ['x'] }, code: 'VALIDATION' });
    expect(log.error).not.toHaveBeenCalled();
    expect(actionError(new Error('db down'), log).code).toBe('INTERNAL');
    expect(log.error).toHaveBeenCalledOnce();
  });
});

describe('withApiHandler', () => {
  const request = new Request('http://localhost/api/x', { headers: { 'x-request-id': 'abc-123456' } });

  it('transformă AppError în JSON cu status, headere și requestId', async () => {
    const handler = withApiHandler('test', async () => { throw rateLimited('Stai puțin', 30); });
    const response = await handler(request, {});
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('30');
    expect(response.headers.get('x-request-id')).toBe('abc-123456');
    expect(await response.json()).toEqual({ error: 'Stai puțin', code: 'RATE_LIMITED', requestId: 'abc-123456' });
  });

  it('prinde erorile neprevăzute, le loghează și întoarce 500 generic', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const handler = withApiHandler('test', async () => { throw new Error('secret internals'); });
    const response = await handler(request, {});
    expect(response.status).toBe(500);
    expect((await response.json()).error).not.toContain('secret');
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('pune requestId în context și pe răspunsul reușit', async () => {
    const handler = withApiHandler('test', async (_req, { requestId }) => Response.json({ requestId }));
    const response = await handler(request, {});
    expect(await response.json()).toEqual({ requestId: 'abc-123456' });
    expect(response.headers.get('x-request-id')).toBe('abc-123456');
  });
});
