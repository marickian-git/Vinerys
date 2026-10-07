import { describe, expect, it } from 'vitest';
import { decryptSecret, encryptSecret } from '@/utils/aiSecrets';

describe('aiSecrets', () => {
  it('criptează și decriptează (round-trip)', () => {
    const encrypted = encryptSecret('sk-test-123');
    expect(encrypted).not.toContain('sk-test');
    expect(decryptSecret(encrypted)).toBe('sk-test-123');
  });

  it('IV aleator: aceeași valoare dă rezultate diferite', () => {
    expect(encryptSecret('x')).not.toBe(encryptSecret('x'));
  });

  it('respinge date alterate (GCM auth tag)', () => {
    const [iv, tag, data] = encryptSecret('secret').split('.');
    const tampered = [iv, tag, data.slice(0, -2) + (data.endsWith('AA') ? 'BB' : 'AA')].join('.');
    expect(() => decryptSecret(tampered)).toThrow();
    expect(() => decryptSecret('invalid')).toThrow('Credential AI invalidă');
  });
});
