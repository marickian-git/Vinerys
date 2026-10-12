// HOME-001: Scor de urgență pentru sticle
// Ordonare: trecut de vârf > iese anul ăsta > la vârf > intră curând. Ponderat cu cantitatea și valoarea.
import { drinkWindow } from './planner';

/**
 * Calculează scorul de urgență pentru o sticlă, luând în considerare fereastra de consum,
 * cantitatea și valoarea estimată.
 * Scorul este mai mare sau egal cu 0, iar valori mai mari indică mai mare urgență.
 * @param {Object} wine - Obiectul vinului cu câmpurile: drinkFrom, drinkUntil, agingPotential, quantity, estimatedValue
 * @param {number} [year] - Anul curent (implicit: anul curent)
 * @returns {number} Scorul de urgență (≥0)
 */
export function urgencyScore(wine, year = new Date().getFullYear()) {
  // 1. Scor de bază pe baza ferestrei de consum (cu fallback la agingPotential)
  const window = drinkWindow(wine);
  let baseUrgency;
  if (!window) {
    // Fereastră necunoscută → scor implicit 0.4 (acesteași ca în Implementarea curentă)
    baseUrgency = 0.4;
  } else {
    const currentYear = year;
    if (window.until < currentYear) {
      // Trecut de vârf
      baseUrgency = 1;
    } else if (window.until === currentYear) {
      // În anul curent
      baseUrgency = 0.9;
    } else if (window.from > currentYear) {
      // Tânăr
      baseUrgency = 0.15;
    } else {
      // În fereastră de consum
      const span = Math.max(1, window.until - window.from);
      baseUrgency = Number((0.45 + 0.4 * ((currentYear - window.from) / span)).toFixed(3));
    }
  }

  // 2. Ponderare cu cantitatea și valoarea (normalizată la valori neutre)
  // Valoarea neutră pentru cantitate: 10 sticle (factor 0.5); pentru valoare: 2500 (unități de monetă, factor 0.5)
  // Cantitatea și valoarea implicite în tests/singure sunt 20 și 5000 (factor 1)
  const quantityDefault = 20;
  const quantityNeutral = 10;
  const valueDefault = 5000;
  const valueNeutral = 2500;

  const qty = wine.quantity == null ? quantityNeutral : wine.quantity;
  const val = wine.estimatedValue == null ? valueNeutral : wine.estimatedValue;

  const quantityFactor = Math.min(qty / quantityDefault, 1);
  const valueFactor = Math.min(val / valueDefault, 1);

  // Scor final = bază * factorCantitate * factorValoare
  return Number((baseUrgency * quantityFactor * valueFactor).toFixed(3));
}