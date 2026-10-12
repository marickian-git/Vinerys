import { describe, expect, it } from 'vitest';
import { mergeVoiceResult, parseWineSpeech } from '@/utils/voiceParse';

describe('parseWineSpeech', () => {
  it('exemplul din issue', () => {
    expect(parseWineSpeech('Am luat 6 Fetească Neagră 2021 de la Davino cu 80 lei.')).toEqual({
      quantity: 6, name: 'Fetească Neagră', vintage: 2021, producer: 'Davino', purchasePrice: 80, currency: 'RON', type: 'RED',
    });
  });

  it.each([
    ['două sticle de Sauvignon Blanc 2023 de la crama Recaș la 45,5 lei', { quantity: 2, name: 'Sauvignon Blanc', vintage: 2023, producer: 'Recaș', purchasePrice: 45.5, currency: 'RON', type: 'WHITE' }],
    ['am cumpărat 3 Barolo 2018 cu 60 euro bucata', { quantity: 3, name: 'Barolo', vintage: 2018, purchasePrice: 60, currency: 'EUR', type: 'RED' }],
    ['un rosé de la Cramele Halewood', { quantity: 1, name: 'Rosé', producer: 'Halewood', type: 'ROSE' }],
    ['Prosecco', { name: 'Prosecco', type: 'SPARKLING' }],
  ])('%s', (text, expected) => {
    expect(parseWineSpeech(text)).toEqual(expected);
  });
});

describe('mergeVoiceResult', () => {
  it('validează câmpurile AI și completează din euristică', () => {
    const fallback = parseWineSpeech('Am luat 6 Fetească Neagră 2021 de la Davino cu 80 lei');
    const merged = mergeVoiceResult({ name: 'Fetească Neagră', vintage: 'x', quantity: 6, type: 'PURPLE', currency: 'RON' }, fallback);
    expect(merged).toMatchObject({ name: 'Fetească Neagră', vintage: 2021, quantity: 6, type: 'RED', producer: 'Davino', purchasePrice: 80, currency: 'RON' });
  });
  it('aruncă dacă nu există nume', () => {
    expect(() => mergeVoiceResult({}, {})).toThrow();
  });
});
