// Cache pentru scanări AI (AI-008). Cheia e SHA-256 pe octeții imaginii: aceeași poză → același rezultat, fără apel AI.
// Se cache-uiesc doar identificările sigure, iar intrările expiră (modelele și datele se îmbunătățesc în timp).
import { createHash } from 'node:crypto';

export const SCAN_CACHE_MIN_CONFIDENCE = 0.6;
export const SCAN_CACHE_MAX_AGE_DAYS = 180;

export function hashImage(imageBase64) {
  const payload = imageBase64.replace(/^data:[^;]+;base64,/, '');
  return createHash('sha256').update(Buffer.from(payload, 'base64')).digest('hex');
}

export function isCacheable(result) {
  const confidence = result?.confidence?.identity ?? 0;
  return Boolean(result?.name || result?.producer) && confidence >= SCAN_CACHE_MIN_CONFIDENCE;
}

export function isFresh(entry, now = new Date(), maxAgeDays = SCAN_CACHE_MAX_AGE_DAYS) {
  return Boolean(entry) && now - new Date(entry.createdAt) < maxAgeDays * 24 * 60 * 60 * 1000;
}

export async function findCachedScan(db, imageHash, now = new Date()) {
  const entry = await db.scanCache.findUnique({ where: { imageHash } });
  if (!isFresh(entry, now)) return null;
  await db.scanCache.update({ where: { imageHash }, data: { hits: { increment: 1 }, lastHitAt: now } });
  return entry;
}

export async function storeScan(db, imageHash, { result, sources }) {
  if (!isCacheable(result)) return false;
  const data = { result, providers: sources, confidence: result.confidence?.identity ?? 0, createdAt: new Date() };
  await db.scanCache.upsert({ where: { imageHash }, create: { imageHash, ...data }, update: data });
  return true;
}
