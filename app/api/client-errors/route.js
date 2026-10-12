// Erorile din browser (error boundary) ajung aici: se loghează și se trimit mai departe dacă SENTRY_DSN e setat.
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/utils/rateLimit';
import { reportError } from '@/utils/errorReporting';
import { validationError, rateLimited, withApiHandler } from '@/utils/errors';

const ClientErrorSchema = z.object({
  name: z.string().max(100).default('Error'),
  message: z.string().max(1000),
  stack: z.string().max(5000).optional(),
  digest: z.string().max(100).optional(),
  path: z.string().max(300).optional(),
});

export const POST = withApiHandler('client-error', async (request, { log }) => {
  const ip = request.headers.get('x-real-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
  if (!rateLimit(`client-error:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 }).ok) throw rateLimited();
  const parsed = ClientErrorSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw validationError();
  const { name, message, stack, digest, path } = parsed.data;
  const error = Object.assign(new Error(message), { name, stack: stack ? `${name}: ${message}\n${stack}` : undefined });
  log.warn('client error', { name, message, digest, path });
  await reportError(error, { tags: { side: 'client', digest }, request: { url: path } });
  return NextResponse.json({ ok: true });
});
