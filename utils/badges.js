// SOCIAL-005: badge-uri și provocări calculate din date (fără tabel: progresul se recalculează mereu).
// Fiecare badge are niveluri; nivelul atins = ultimul prag depășit, progresul = spre următorul.
export const BADGES = [
  { id: 'globetrotter', icon: '🌍', name: 'Globetrotter', description: 'Vinuri din țări diferite', metric: 'countries', tiers: [3, 5, 10, 20] },
  { id: 'grape-explorer', icon: '🍇', name: 'Explorator de soiuri', description: 'Soiuri diferite în colecție', metric: 'varieties', tiers: [5, 10, 25, 50] },
  { id: 'taster', icon: '📓', name: 'Degustător', description: 'Degustări notate în jurnal', metric: 'tastings', tiers: [1, 10, 25, 50] },
  { id: 'open-bottles', icon: '🍷', name: 'Sticle deschise', description: 'Sticle consumate', metric: 'bottlesConsumed', tiers: [10, 25, 50, 100] },
  { id: 'collector', icon: '🏛️', name: 'Colecționar', description: 'Sticle în pivniță acum', metric: 'bottlesInCellar', tiers: [12, 24, 50, 100] },
  { id: 'romania', icon: '🇷🇴', name: 'Podgoriile României', description: 'Regiuni românești în colecție', metric: 'romanianRegions', tiers: [2, 4, 6, 8] },
  { id: 'on-time', icon: '⏳', name: 'La momentul potrivit', description: 'Sticle deschise în fereastra de consum', metric: 'openedInWindow', tiers: [5, 15, 30, 60] },
  { id: 'scanner', icon: '📷', name: 'Ochi de sommelier', description: 'Etichete scanate cu AI', metric: 'scans', tiers: [5, 20, 50, 100] },
];

export const TIER_NAMES = ['Bronz', 'Argint', 'Aur', 'Platină'];

export function evaluateBadges(stats) {
  return BADGES.map((badge) => {
    const value = Number(stats[badge.metric] ?? 0);
    const level = badge.tiers.filter((threshold) => value >= threshold).length; // 0 = neatins
    const next = badge.tiers[level] ?? null;
    const previous = level > 0 ? badge.tiers[level - 1] : 0;
    return {
      ...badge,
      value,
      level,
      tierName: level > 0 ? TIER_NAMES[level - 1] : null,
      next,
      progress: next == null ? 1 : Math.max(0, Math.min(1, (value - previous) / (next - previous))),
    };
  });
}

// Provocarea cea mai apropiată de următorul nivel (cea care contează pentru motivare)
export function nextChallenge(evaluated) {
  return evaluated.filter((badge) => badge.next != null).sort((a, b) => b.progress - a.progress)[0] ?? null;
}
