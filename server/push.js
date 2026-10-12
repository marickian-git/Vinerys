// CELLAR-007: notificări Web Push (VAPID). Dezactivate dacă VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY lipsesc.
import webpush from 'web-push';
import prisma from '../utils/db';
import { buildDigest } from '../utils/digest';
import { buildWeekendPlan, weekendNotification } from '../utils/weekendPlan';
import { tasteProfileFor } from './taste';
import { predictPreference } from '../utils/tasteProfile';
import { configuredAppURL } from '../utils/appPath';
import { createLogger, serializeError } from '../utils/logger';

const logger = createLogger('push');
let configured = null;

export function pushEnabled(env = process.env) {
  return Boolean(env.VAPID_PUBLIC_KEY && env.VAPID_PRIVATE_KEY);
}

function ensureConfigured() {
  if (configured !== null) return configured;
  configured = pushEnabled();
  if (configured) webpush.setVapidDetails(process.env.VAPID_SUBJECT || `mailto:${process.env.EMAIL_FROM?.match(/<(.+)>/)?.[1] ?? 'admin@example.com'}`, process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  return configured;
}

export async function saveSubscription(userId, subscription, userAgent) {
  const { endpoint, keys } = subscription;
  return prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth, userAgent: userAgent?.slice(0, 200) },
    update: { userId, p256dh: keys.p256dh, auth: keys.auth },
  });
}

export async function removeSubscription(userId, endpoint) {
  await prisma.pushSubscription.deleteMany({ where: { userId, endpoint } });
}

// Trimite către toate dispozitivele utilizatorului; abonamentele expirate (404/410) sunt șterse
export async function sendToUser(userId, payload, { send } = {}) {
  if (!send) {
    if (!ensureConfigured()) return 0;
    send = (sub, body) => webpush.sendNotification(sub, body);
  }
  const subscriptions = await prisma.pushSubscription.findMany({ where: { userId } });
  const url = payload.url ? `${configuredAppURL()}${payload.url}` : configuredAppURL();
  let delivered = 0;
  for (const sub of subscriptions) {
    try {
      await send({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify({ ...payload, url }));
      delivered += 1;
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
      else logger.warn('push failed', { userId, error: serializeError(error) });
    }
  }
  return delivered;
}

// Rezumatul lunar pentru toți abonații; fiecare utilizator îl primește cel mult o dată pe lună
export async function sendMonthlyDigests({ now = new Date(), send } = {}) {
  const users = await prisma.user.findMany({ where: { pushSubscriptions: { some: {} } }, select: { id: true } });
  const report = { users: users.length, sent: 0, skipped: 0 };
  for (const { id } of users) {
    const wines = await prisma.wine.findMany({ where: { userId: id, status: 'IN_CELLAR', quantity: { gt: 0 } } });
    const digest = buildDigest(wines, now);
    if (!digest) { report.skipped += 1; continue; }
    const already = await prisma.notificationLog.findUnique({ where: { userId_key: { userId: id, key: digest.key } } });
    if (already) { report.skipped += 1; continue; }
    const delivered = await sendToUser(id, digest, send ? { send } : undefined);
    if (delivered > 0) {
      await prisma.notificationLog.create({ data: { userId: id, key: digest.key } });
      report.sent += 1;
    } else report.skipped += 1;
  }
  logger.info('monthly digests', report);
  return report;
}

// HOME-006: planul de weekend pentru un utilizator (afișat în Sommelier și în Plan)
export async function weekendPlanFor(userId, now = new Date()) {
  const [wines, { profile }] = await Promise.all([
    prisma.wine.findMany({ where: { userId, status: 'IN_CELLAR', quantity: { gt: 0 } } }),
    tasteProfileFor(userId, { recommendations: 0 }),
  ]);
  const taste = (wine) => (profile.evidence ? predictPreference(wine, profile).score : 0.5);
  return buildWeekendPlan(wines, { now, taste });
}

// Vineri: „Weekendul ăsta: deschide X, merge cu Y” (o dată pe weekend)
export async function sendWeekendPlans({ now = new Date(), send } = {}) {
  const users = await prisma.user.findMany({ where: { pushSubscriptions: { some: {} } }, select: { id: true } });
  const report = { users: users.length, sent: 0, skipped: 0 };
  for (const { id } of users) {
    const notification = weekendNotification(await weekendPlanFor(id, now), now);
    if (!notification || await prisma.notificationLog.findUnique({ where: { userId_key: { userId: id, key: notification.key } } })) {
      report.skipped += 1;
      continue;
    }
    if (await sendToUser(id, notification, send ? { send } : undefined)) {
      await prisma.notificationLog.create({ data: { userId: id, key: notification.key } });
      report.sent += 1;
    } else report.skipped += 1;
  }
  logger.info('weekend plans', report);
  return report;
}
