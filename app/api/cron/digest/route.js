import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { sendMonthlyDigests, sendWeekendPlans } from '@/server/push';
import { unauthenticated, withApiHandler } from '@/utils/errors';

// Rulat de un cron extern (CasaOS / crontab):
//   lunar:          curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://…/crama/api/cron/digest
//   vineri (17:00): curl -X POST -H "Authorization: Bearer $CRON_SECRET" "https://…/crama/api/cron/digest?kind=weekend"
function authorized(request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  return Boolean(secret) && given.length === secret.length && timingSafeEqual(Buffer.from(given), Buffer.from(secret));
}

export const POST = withApiHandler('cron-digest', async (request) => {
  if (!authorized(request)) throw unauthenticated();
  const kind = new URL(request.url).searchParams.get('kind');
  return NextResponse.json(kind === 'weekend' ? await sendWeekendPlans() : await sendMonthlyDigests());
});
