import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { rateLimit, tooManyRequestsMessage } from '@/utils/rateLimit';

describe('rateLimit', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('permite până la limită, apoi blochează cu retryAfter', () => {
    const key = `t-${Math.random()}`;
    const opts = { limit: 3, windowMs: 60_000 };
    expect([1, 2, 3].map(() => rateLimit(key, opts).ok)).toEqual([true, true, true]);
    const blocked = rateLimit(key, opts);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfter).toBe(60);
  });

  it('eliberează după expirarea ferestrei', () => {
    const key = `t-${Math.random()}`;
    const opts = { limit: 1, windowMs: 1_000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(rateLimit(key, opts).ok).toBe(true);
  });

  it('cheile sunt independente', () => {
    const opts = { limit: 1, windowMs: 60_000 };
    expect(rateLimit(`a-${Math.random()}`, opts).ok).toBe(true);
    expect(rateLimit(`b-${Math.random()}`, opts).ok).toBe(true);
  });

  it('mesaj în română cu singular/plural', () => {
    expect(tooManyRequestsMessage(30)).toContain('1 minut.');
    expect(tooManyRequestsMessage(600)).toContain('10 minute.');
  });
});
