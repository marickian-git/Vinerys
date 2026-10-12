import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { sendMonthlyDigests } from '@/server/push';
import { unauthenticated, withApiHandler } from '@/utils/errors';

// Rulat lunar de un cron extern (CasaOS / crontab):
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://…/crama/api/cron/digest
function authorized(request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  return Boolean(secret) && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export const POST = withApiHandler('cron-digest', async (request) => {
  if (!authorized(request)) throw unauthenticated();
  return NextResponse.json(await sendMonthlyDigests());
});
