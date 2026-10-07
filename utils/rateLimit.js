// Rate limiting în memorie (fereastră glisantă), per cheie (ex. userId + acțiune).
// Suficient pentru o singură instanță; la scalare orizontală se mută în Redis/DB.
const buckets = new Map();
const MAX_KEYS = 10_000;

export const LIMITS = {
  aiScan: { limit: 10, windowMs: 10 * 60 * 1000 },
  upload: { limit: 30, windowMs: 10 * 60 * 1000 },
  passwordChange: { limit: 5, windowMs: 10 * 60 * 1000 },
};

export function rateLimit(key, { limit, windowMs }) {
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((time) => now - time < windowMs);

  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { ok: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) };
  }

  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > MAX_KEYS) {
    for (const [bucketKey, times] of buckets) {
      if (!times.length || now - times[times.length - 1] > windowMs) buckets.delete(bucketKey);
    }
  }
  return { ok: true };
}

export function tooManyRequestsMessage(retryAfter) {
  const minutes = Math.ceil(retryAfter / 60);
  return `Prea multe încercări. Încearcă din nou în ${minutes} ${minutes === 1 ? 'minut' : 'minute'}.`;
}
