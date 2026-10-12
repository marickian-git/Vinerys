import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRoute, readJson } from '@/server/api';
import { pushEnabled, removeSubscription, saveSubscription } from '@/server/push';
import { AppError } from '@/utils/errors';

const SubscriptionSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

// GET: cheia publică VAPID (pentru abonare în browser); POST: salvează abonamentul; DELETE: îl șterge
export const GET = apiRoute('push', async () => NextResponse.json({ enabled: pushEnabled(), publicKey: process.env.VAPID_PUBLIC_KEY ?? null }));

export const POST = apiRoute('push', async (request, { user }) => {
  if (!pushEnabled()) throw new AppError('VALIDATION', { userMessage: 'Notificările nu sunt configurate pe server.' });
  const subscription = await readJson(request, SubscriptionSchema);
  await saveSubscription(user.id, subscription, request.headers.get('user-agent'));
  return NextResponse.json({ ok: true }, { status: 201 });
});

export const DELETE = apiRoute('push', async (request, { user }) => {
  const { endpoint } = await readJson(request, z.object({ endpoint: z.string().url() }));
  await removeSubscription(user.id, endpoint);
  return new NextResponse(null, { status: 204 });
});
