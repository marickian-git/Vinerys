// Cursurile de schimb BCE (actualizate zilnic), cu cache în memorie 12 h.
// Fallback: FX_RATES_JSON (ex. {"RON":4.97,"USD":1.08}); fără niciun curs, conversiile întorc null.
import { parseEcbXml } from '../utils/currency';
import { createLogger, serializeError } from '../utils/logger';

const ECB_URL = 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';
const TTL_MS = 12 * 60 * 60 * 1000;
// După un eșec nu reîncercăm la fiecare cerere (timeout 4 s), ci după 30 min
const RETRY_MS = 30 * 60 * 1000;
const logger = createLogger('fx');
let cache = null;

function envRates() {
  try {
    const rates = JSON.parse(process.env.FX_RATES_JSON || 'null');
    return rates && typeof rates === 'object' ? { EUR: 1, ...rates } : null;
  } catch {
    return null;
  }
}

export async function getRates({ fetchImpl = fetch, now = Date.now() } = {}) {
  if (cache && now - cache.at < (cache.failed ? RETRY_MS : TTL_MS)) return cache.rates;
  try {
    const response = await fetchImpl(ECB_URL, { signal: AbortSignal.timeout(4000) });
    if (!response.ok) throw new Error(`ECB ${response.status}`);
    const rates = parseEcbXml(await response.text());
    if (!rates) throw new Error('ECB: răspuns fără cursuri');
    cache = { rates, at: now };
    return rates;
  } catch (error) {
    logger.warn('ECB rates unavailable', { error: serializeError(error) });
    const fallback = cache?.rates ?? envRates();
    cache = { rates: fallback, at: now, failed: true };
    return fallback;
  }
}

export function resetRatesCache() {
  cache = null;
}
