// Logging structurat (REFACTOR-005): o linie JSON pe eveniment în producție, text lizibil în dev.
// Fără dependențe, ca să meargă și în proxy (edge). Secretele și PII-ul se maschează înainte de scriere.

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

// Chei care nu ajung niciodată în log (comparație case-insensitive, pe orice nivel de imbricare)
const SECRET_KEYS = /pass(word)?$|secret$|^(access|refresh|id|session)?_?token$|api[-_]?key$|^authorization$|cookie$|imagebase64$|^encrypted/i;
// PII: emailul se maschează parțial, nu se scoate (util pentru suport)
const EMAIL = /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g;
const MAX_STRING = 2000;
const MAX_DEPTH = 6;

export function maskEmail(value) {
  return value.replace(EMAIL, (_, first, domain) => `${first}***@${domain}`);
}

export function redact(value, depth = 0) {
  if (value == null) return value;
  if (typeof value === 'string') {
    const masked = maskEmail(value);
    return masked.length > MAX_STRING ? `${masked.slice(0, MAX_STRING)}…[${masked.length}]` : masked;
  }
  if (typeof value !== 'object') return value;
  if (depth >= MAX_DEPTH) return '[depth]';
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => redact(item, depth + 1));
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    out[key] = SECRET_KEYS.test(key) ? '[redacted]' : redact(item, depth + 1);
  }
  return out;
}

export function serializeError(error) {
  if (!(error instanceof Error)) return redact(error);
  const out = { name: error.name, message: maskEmail(error.message ?? '') };
  for (const key of ['code', 'status', 'providerStatus']) {
    if (error[key] != null) out[key] = error[key];
  }
  if (process.env.NODE_ENV !== 'production' && error.stack) out.stack = error.stack.split('\n').slice(0, 6).join('\n');
  return out;
}

function minLevel() {
  const configured = process.env.LOG_LEVEL?.toLowerCase();
  if (configured in LEVELS) return LEVELS[configured];
  return process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug;
}

function write(level, scope, message, context) {
  if (LEVELS[level] < minLevel()) return;
  const entry = { time: new Date().toISOString(), level, scope, msg: message, ...redact(context ?? {}) };
  const sink = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  if (process.env.NODE_ENV === 'production' || process.env.LOG_FORMAT === 'json') {
    sink(JSON.stringify(entry));
    return;
  }
  const { time, level: _level, scope: _scope, msg, ...rest } = entry;
  const extra = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
  sink(`${time.slice(11, 23)} ${level.toUpperCase().padEnd(5)} [${scope}] ${msg}${extra}`);
}

// logger.child({ requestId, userId }) adaugă câmpuri fixe pe toate liniile
export function createLogger(scope, bindings = {}) {
  const log = (level) => (message, context) => write(level, scope, message, { ...bindings, ...context });
  return {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
    child: (extra) => createLogger(scope, { ...bindings, ...extra }),
  };
}

// ID de cerere: refolosește header-ul de la reverse proxy dacă există
export function requestIdFrom(headers) {
  const incoming = headers?.get?.('x-request-id');
  if (incoming && /^[\w.-]{6,128}$/.test(incoming)) return incoming;
  return globalThis.crypto.randomUUID();
}
