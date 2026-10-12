// HOME-006: planul de weekend. Vineri, sâmbătă, duminică: câte un vin (cele mai urgente, apoi pe gustul tău),
// cu mâncarea din asocierile lui și temperatura de servire. Fără AI: rapid, gratuit, previzibil.
import { urgencyScore } from './foodToWine';

const DAYS = ['Vineri', 'Sâmbătă', 'Duminică'];
// Data locală (nu toISOString, care ar muta ziua în fusurile orare din fața UTC)
const localDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Vinerea săptămânii curente (sau cea care tocmai a trecut, dacă e weekend)
export function weekendStart(now = new Date()) {
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = date.getDay(); // 0 = duminică … 5 = vineri, 6 = sâmbătă
  const offset = day === 0 ? -2 : day === 6 ? -1 : 5 - day;
  date.setDate(date.getDate() + offset);
  return date;
}

export function weekKey(now = new Date()) {
  const friday = weekendStart(now);
  return `weekend:${localDate(friday)}`;
}

export function buildWeekendPlan(wines, { now = new Date(), taste = () => 0.5 } = {}) {
  const year = now.getFullYear();
  const friday = weekendStart(now);
  const picks = wines
    .filter((w) => w.status === 'IN_CELLAR' && (w.quantity ?? 0) > 0)
    .map((w) => ({ wine: w, score: urgencyScore(w, year) * 0.7 + taste(w) * 0.3 }))
    .sort((a, b) => b.score - a.score)
    // Variație: nu același tip trei seri la rând, dacă există alternative
    .reduce((chosen, item) => {
      if (chosen.length >= 3) return chosen;
      const sameType = chosen.filter((c) => c.wine.type === item.wine.type).length;
      return sameType >= 2 ? chosen : [...chosen, item];
    }, []);
  return picks.map(({ wine }, index) => {
    const date = new Date(friday);
    date.setDate(friday.getDate() + index);
    return {
      day: DAYS[index],
      date: localDate(date),
      wine: { id: wine.id, name: wine.name, vintage: wine.vintage ?? null, type: wine.type, cellarLocation: wine.cellarLocation ?? null },
      food: wine.foodPairing?.[0] ?? null,
      servingTemperature: wine.servingTemperature ?? null,
      urgent: urgencyScore(wine, year) >= 0.9,
    };
  });
}

export function weekendNotification(plan, now = new Date()) {
  if (!plan.length) return null;
  const [first] = plan;
  const name = [first.wine.name, first.wine.vintage].filter(Boolean).join(' ');
  return {
    key: weekKey(now),
    title: 'Weekendul ăsta 🍷',
    body: `Deschide ${name}${first.food ? `, merge cu ${first.food.toLocaleLowerCase('ro-RO')}` : ''}.${plan.length > 1 ? ` Încă ${plan.length - 1} ${plan.length === 2 ? 'idee' : 'idei'} în plan.` : ''}`,
    url: '/planner',
  };
}
