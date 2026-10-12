// GDPR (BIZ-004): exportul complet al datelor utilizatorului, ca JSON descărcabil.
// Nu include secrete: cheile AI criptate, parola și tokenii de sesiune nu pleacă din DB.
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';
import { rateLimited, unauthenticated, withApiHandler } from '@/utils/errors';
import { rateLimit, tooManyRequestsMessage } from '@/utils/rateLimit';

const EXPORT_LIMIT = { limit: 5, windowMs: 60 * 60 * 1000 };

export const GET = withApiHandler('account-export', async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw unauthenticated();

  const limited = rateLimit(`export-account:${session.user.id}`, EXPORT_LIMIT);
  if (!limited.ok) throw rateLimited(tooManyRequestsMessage(limited.retryAfter), limited.retryAfter);

  const userId = session.user.id;
  const [user, wines, wineLogs, aiAgents, aiUsage, sessions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, name: true, email: true, emailVerified: true, image: true, role: true,
        cellarName: true, shareEnabled: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.wine.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.wineLog.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.aIAgent.findMany({
      where: { userId },
      select: {
        id: true, name: true, provider: true, providerType: true, baseUrl: true, model: true,
        billingType: true, enabled: true, priority: true, createdAt: true, updatedAt: true,
      },
    }),
    prisma.aIUsage.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.session.findMany({ where: { userId }, select: { createdAt: true, expiresAt: true, ipAddress: true, userAgent: true } }),
  ]);

  const body = {
    format: 'vinerys-export',
    version: 1,
    exportedAt: new Date().toISOString(),
    note: 'Imaginile sunt referite prin URL; cheile AI și parola nu sunt incluse.',
    user,
    wines,
    wineLogs,
    aiAgents,
    aiUsage,
    sessions,
  };

  return new NextResponse(JSON.stringify(body, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="vinerys-datele-mele-${new Date().toISOString().slice(0, 10)}.json"`,
      'Cache-Control': 'no-store',
    },
  });
});
