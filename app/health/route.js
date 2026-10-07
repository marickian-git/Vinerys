import prisma from '@/utils/db';

export const dynamic = 'force-dynamic';

// Folosit de healthcheck-ul Docker: 503 dacă baza de date nu răspunde
export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({
      status: 'ok',
      app: 'vinerys',
      db: 'ok',
      dbLatencyMs: Date.now() - startedAt,
      version: process.env.APP_VERSION || null,
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json(
      { status: 'error', app: 'vinerys', db: 'unreachable', timestamp: new Date().toISOString() },
      { status: 503 },
    );
  }
}
