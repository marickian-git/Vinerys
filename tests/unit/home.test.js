// HOME-001: Scor de urgență pentru sticle
import { describe, expect, it } from 'vitest';
import { urgencyScore } from '../../utils/urgency';

const Y = 2026;

// Helper to create a wine object
const wine = (overrides = {}) => ({
  id: 'test-wine',
  name: 'Test Wine',
  producer: 'Test Producer',
  quantity: 20,
  estimatedValue: 5000,
  drinkFrom: null,
  drinkUntil: null,
  agingPotential: null,
  ...overrides,
});

describe('urgencyScore', () => {
  describe('basic urgency based on drink window', () => {
    it('trecut de vârf → 1', () => {
      const w = wine({ drinkFrom: 2015, drinkUntil: 2020 });
      expect(urgencyScore(w, Y)).toBe(1);
    });

    it('la vârf → 0.9', () => {
      const w = wine({ drinkFrom: 2020, drinkUntil: 2026 });
      expect(urgencyScore(w, Y)).toBe(0.9);
    });

    it('ânsfar → 0.15', () => {
      const w = wine({ drinkFrom: 2030, drinkUntil: 2040 });
      expect(urgencyScore(w, Y)).toBe(0.15);
    });

    it('în fereastră → liniar între 0.15 și 0.9', () => {
      // ex: drinkFrom=2020, drinkUntil=2030, year=2026 → 15% + 40% of window progress = 0.45 + 0.4*0.6 = 0.69
      const w = wine({ drinkFrom: 2020, drinkUntil: 2030 });
      expect(urgencyScore(w, Y)).toBeCloseTo(0.69);
    });

    it('fără drinkFrom/drinkUntil → fallback la agingPotential', () => {
      // agingPotential conține ani: [2020, 2030] → similar la fereastră
      const w = wine({ agingPotential: '2020-2030' });
      expect(urgencyScore(w, Y)).toBeCloseTo(0.69);
    });

    it('fără drinkFrom/drinkUntil și fără agingPotential → 0.4', () => {
      const w = wine({});
      expect(urgencyScore(w, Y)).toBe(0.4);
    });
  });

  describe('ponderare cu cantitatea', () => {
    it('cantitatea 0 → scor 0', () => {
      const w = wine({ drinkFrom: 2015, drinkUntil: 2020, quantity: 0 });
      expect(urgencyScore(w, Y)).toBe(0);
    });

    it('cantitatea dublă → scorul duble (întil baseUrgency * quantityFactor)', () => {
      const w1 = wine({ drinkFrom: 2015, drinkUntil: 2020, quantity: 1 });
      const w2 = wine({ drinkFrom: 2015, drinkUntil: 2020, quantity: 2 });
      // предположим maxQuantity = 20, тому quantityFactor pentru 1 = 1/20 = 0.05, pentru 2 = 0.1
      // тому отношение должно быть 2:1
      expect(urgencyScore(w2, Y)).toBeCloseTo(urgencyScore(w1, Y) * 2);
    });

    it('cantitatea peste max → limita la 1', () => {
      const w1 = wine({ drinkFrom: 2015, drinkUntil: 2020, quantity: 20 });
      const w2 = wine({ drinkFrom: 2015, drinkUntil: 2020, quantity: 100 });
      // Оба мають quantityFactor = 1 (через Math.min)
      expect(urgencyScore(w2, Y)).toBeCloseTo(urgencyScore(w1, Y));
    });
  });

  describe('ponderare cu valoarea', () => {
    it('valoarea 0 → scor 0', () => {
      const w = wine({ drinkFrom: 2015, drinkUntil: 2020, estimatedValue: 0 });
      expect(urgencyScore(w, Y)).toBe(0);
    });

    it('valoarea dublă → scorul duble (întil baseUrgency * valueFactor)', () => {
      const w1 = wine({ drinkFrom: 2015, drinkUntil: 2020, estimatedValue: 100 });
      const w2 = wine({ drinkFrom: 2015, drinkUntil: 2020, estimatedValue: 200 });
      // предположим maxValue = 5000, тому valueFactor для 100 = 100/5000 = 0.02, pentru 200 = 0.04
      // отношение 2:1
      expect(urgencyScore(w2, Y)).toBeCloseTo(urgencyScore(w1, Y) * 2);
    });

    it('valoarea peste max → limita la 1', () => {
      const w1 = wine({ drinkFrom: 2015, drinkUntil: 2020, estimatedValue: 5000 });
      const w2 = wine({ drinkFrom: 2015, drinkUntil: 2020, estimatedValue: 20000 });
      // Оба мають valueFactor = 1
      expect(urgencyScore(w2, Y)).toBeCloseTo(urgencyScore(w1, Y));
    });

    it('fără valoarea → factorul neutral 0.5', () => {
      const wNoValue = wine({ drinkFrom: 2015, drinkUntil: 2020, estimatedValue: null });
      const wWithValue = wine({ drinkFrom: 2015, drinkUntil: 2020, estimatedValue: 2500 }); // 2500/5000 = 0.5
      expect(urgencyScore(wNoValue, Y)).toBeCloseTo(urgencyScore(wWithValue, Y));
    });
  });

  describe('combinare factorilor', () => {
    it('toate factorii la maxim → scor 1', () => {
      // drinkFrom/Until таке, що baseUrgency = 1 (наприклад, trecut de vârf)
      // quantity = 20 → quantityFactor = 1
      // estimatedValue = 5000 → valueFactor = 1
      const w = wine({ drinkFrom: 2015, drinkUntil: 2020, quantity: 20, estimatedValue: 5000 });
      expect(urgencyScore(w, Y)).toBeCloseTo(1);
    });

    it('jeden faktor нуль → scor нуль', () => {
      const w = wine({ drinkFrom: 2015, drinkUntil: 2020, quantity: 0, estimatedValue: 100 });
      expect(urgencyScore(w, Y)).toBe(0);
    });
  });
});