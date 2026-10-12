// REFACTOR-006: raportarea erorilor către Sentry sau GlitchTip (self-hosted, același protocol), fără SDK.
// Activ doar când SENTRY_DSN e setat. Clientul minimal trimite un „envelope” cu evenimentul;
// datele trec prin aceeași redactare ca logurile (fără secrete, emailuri mascate).
import { randomUUID } from 'node:crypto';
import { redact } from './logger';

export function parseDsn(dsn) {
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.split('/').filter(Boolean).pop();
    if (!url.username || !projectId) return null;
    const prefix = url.pathname.slice(0, url.pathname.lastIndexOf('/'));
    return { key: url.username, envelopeUrl: `${url.protocol}//${url.host}${prefix}/api/${projectId}/envelope/` };
  } catch {
    return null;
  }
}

function parseStack(stack = '') {
  // Sentry așteaptă cadrele de la cel mai vechi la cel mai nou
  return stack.split('\n').slice(1, 30).map((line) => {
    const match = line.match(/at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/);
    return match ? { function: match[1] || '?', filename: match[2], lineno: Number(match[3]), colno: Number(match[4]) } : null;
  }).filter(Boolean).reverse();
}

export function buildEvent(error, { level = 'error', tags = {}, extra = {}, request } = {}) {
  const err = error instanceof Error ? error : new Error(String(error?.message ?? error));
  return {
    event_id: randomUUID().replace(/-/g, ''),
    timestamp: Date.now() / 1000,
    platform: 'javascript',
    level,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || process.env.GIT_SHA || undefined,
    server_name: 'vinerys',
    tags: redact(tags),
    extra: redact(extra),
    request: request ? redact(request) : undefined,
    exception: {
      values: [{ type: err.name || 'Error', value: redact(err.message ?? ''), stacktrace: err.stack ? { frames: parseStack(err.stack) } : undefined }],
    },
  };
}

export async function reportError(error, context = {}, { dsn = process.env.SENTRY_DSN, fetchImpl = fetch } = {}) {
  const target = dsn && parseDsn(dsn);
  if (!target) return false;
  const event = buildEvent(error, context);
  const body = [
    JSON.stringify({ event_id: event.event_id, sent_at: new Date().toISOString() }),
    JSON.stringify({ type: 'event' }),
    JSON.stringify(event),
  ].join('\n');
  try {
    const response = await fetchImpl(target.envelopeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${target.key}, sentry_client=vinerys/1.0`,
      },
      body,
      signal: AbortSignal.timeout(3000),
    });
    return response.ok;
  } catch {
    return false; // raportarea nu are voie să strice cererea
  }
}
