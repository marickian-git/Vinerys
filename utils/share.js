import { configuredAppURL } from './appPath.mjs';

// Ruta publică e /crama/[shareId] sub basePath, deci URL-ul conține /crama de două ori când basePath=/crama
export function shareUrlFor(shareId) {
  return shareId ? `${configuredAppURL()}/crama/${shareId}` : null;
}
