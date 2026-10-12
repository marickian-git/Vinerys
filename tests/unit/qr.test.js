import { describe, expect, it } from 'vitest';
import { bottleUrl, qrSvg } from '@/utils/qr';

describe('QR', () => {
  it('URL-ul sticlei include basePath-ul aplicației', () => {
    expect(bottleUrl('abc123', 'https://casa.ro/crama')).toBe('https://casa.ro/crama/q/abc123');
  });

  it('generează un SVG valid', async () => {
    const svg = await qrSvg('https://casa.ro/crama/q/abc123');
    expect(svg).toMatch(/^<svg[\s\S]*<\/svg>\s*$/);
    expect(svg).toContain('viewBox');
  });
});
