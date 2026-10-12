// ARCH-008: utilitare pentru API-ul /api/v1 (aplicația mobilă). Autentificare prin cookie sau Authorization: Bearer.
import { auth } from '../utils/auth';
import { rateLimited, unauthenticated, validationError, withApiHandler } from '../utils/errors';
import { rateLimit, tooManyRequestsMessage } from '../utils/rateLimit';
import { z } from 'zod';

const API_LIMIT = { limit: 120, windowMs: 60 * 1000 };

export async function requireApiUser(request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) throw unauthenticated();
  const limited = rateLimit(`api:${session.user.id}`, API_LIMIT);
  if (!limited.ok) throw rateLimited(tooManyRequestsMessage(limited.retryAfter), limited.retryAfter);
  return session.user;
}

// Handler autentificat: (request, { user, params, log, requestId })
export function apiRoute(scope, handler) {
  return withApiHandler(`api:${scope}`, async (request, context) => {
    const user = await requireApiUser(request);
    const params = context?.params ? await context.params : {};
    return handler(request, { ...context, user, params, log: context.log.child({ userId: user.id }) });
  });
}

export async function readJson(request, schema) {
  const body = await request.json().catch(() => {
    throw validationError(undefined, 'Corpul cererii trebuie să fie JSON valid');
  });
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success) throw validationError(z.flattenError(parsed.error).fieldErrors);
  return parsed.data;
}
