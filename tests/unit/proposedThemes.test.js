import { describe, expect, it } from 'vitest';
import themes from '@/docs/design/proposed-themes.tokens.json';

// Contrast WCAG 2.x între două culori hex
function luminance(hex) {
  const [r, g, b] = hex.match(/\w\w/g).map((c) => {
    const v = parseInt(c, 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

describe.each(['F', 'G', 'H'])('tema %s', (id) => {
  const t = themes[id];
  it.each([
    ['text', 'bg'], ['text', 'surface'], ['text-muted', 'bg'], ['text-muted', 'surface'],
    ['on-accent', 'accent'], ['urgent', 'surface'],
  ])('%s pe %s trece AA (4.5:1)', (fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(4.5);
  });
});
