// HOME-005: după „Deschide sticla”, a doua zi întrebăm „Cum a fost?” (rating, notă, poză).
// O consumare are nevoie de follow-up dacă e din ultimele `maxAgeDays` zile, a trecut `minAgeHours`
// și nu există o degustare pentru același vin după momentul consumului.
export function pendingFollowUps(consumptions, tastings, { now = new Date(), minAgeHours = 12, maxAgeDays = 7 } = {}) {
  const newest = new Map();
  for (const item of consumptions) {
    if (!item.wineId) continue;
    const at = new Date(item.at);
    const age = now - at;
    if (age < minAgeHours * 3600_000 || age > maxAgeDays * 86_400_000) continue;
    const current = newest.get(item.wineId);
    if (!current || at > new Date(current.at)) newest.set(item.wineId, { ...item, at });
  }
  return [...newest.values()]
    .filter((item) => !tastings.some((t) => t.wineId === item.wineId && new Date(t.tastedAt) >= startOfDay(item.at)))
    .sort((a, b) => b.at - a.at);
}

// O degustare din aceeași zi cu consumul (chiar notată înainte de click) acoperă follow-up-ul
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
