import { describe, expect, it } from 'vitest';
import { validateProviderBaseUrl } from '@/utils/aiUrlSecurity';

const check = (url) => validateProviderBaseUrl(url, { resolve: false });

describe('validateProviderBaseUrl (SSRF)', () => {
  it('acceptă endpointuri HTTPS publice și normalizează slash-ul final', async () => {
    await expect(check('https://api.example.com/v1/')).resolves.toBe('https://api.example.com/v1');
  });

  it.each([
    ['http://api.example.com/v1', 'HTTPS'],
    ['https://user:pass@api.example.com', 'credentiale'],
    ['https://api.example.com:8443', 'Portul'],
    ['https://localhost/v1', 'Hostname'],
    ['https://metadata.google.internal', 'Hostname'],
    ['https://127.0.0.1', 'private'],
    ['https://10.0.0.5', 'private'],
    ['https://192.168.1.10', 'private'],
    ['https://172.20.0.1', 'private'],
    ['https://169.254.169.254', 'private'],
    ['https://[::1]', 'private'],
    ['https://[::ffff:127.0.0.1]', 'private'],
    ['https://[fd00::1]', 'private'],
    ['https://100.64.0.1', 'private'],
    ['not-a-url', 'URL valid'],
  ])('respinge %s', async (url, message) => {
    await expect(check(url)).rejects.toThrow(message);
  });
});
