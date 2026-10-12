// CELLAR-007: rezumatul lunar trimis ca notificare push. Funcție pură peste vinurile din pivniță.
//   „3 vinuri intră în fereastră anul acesta” · „Merlot 2019 iese din fereastră anul acesta” · „2 vinuri au trecut de vârf”
import { drinkWindow } from './planner';

export function buildDigest(wines, now = new Date()) {
  const year = now.getFullYear();
  const cellar = wines.filter((w) => w.status === 'IN_CELLAR' && (w.quantity ?? 0) > 0);
  const withWindow = cellar.map((w) => ({ wine: w, window: drinkWindow(w) })).filter((x) => x.window);
  const entering = withWindow.filter((x) => x.window.from === year);
  const ending = withWindow.filter((x) => x.window.until === year);
  const overdue = withWindow.filter((x) => x.window.until < year);

  const label = (x) => [x.wine.name, x.wine.vintage].filter(Boolean).join(' ');
  const lines = [];
  if (overdue.length) lines.push(overdue.length === 1 ? `${label(overdue[0])} a trecut de vârf` : `${overdue.length} vinuri au trecut de vârf`);
  if (ending.length) lines.push(ending.length === 1 ? `${label(ending[0])} iese din fereastră anul acesta` : `${ending.length} vinuri ies din fereastră anul acesta`);
  if (entering.length) lines.push(entering.length === 1 ? `${label(entering[0])} intră în fereastră anul acesta` : `${entering.length} vinuri intră în fereastră anul acesta`);
  if (!lines.length) return null;

  const first = overdue[0] ?? ending[0] ?? entering[0];
  return {
    key: `digest:${year}-${String(now.getMonth() + 1).padStart(2, '0')}`,
    title: overdue.length || ending.length ? 'De băut curând 🍷' : 'Vești din pivniță 🍷',
    body: `${lines.join(' · ')}.`,
    url: overdue.length + ending.length + entering.length === 1 ? `/wines/${first.wine.id}` : '/planner',
  };
}
