// CELLAR-002: QR pe sticlă. Codul duce la /q/<wineId>, unde deschizi o sticlă cu un singur tap.
// Până la modelul Bottle (#30) QR-ul e per vin; foaia de etichete are câte unul pentru fiecare sticlă.
import QRCode from 'qrcode';
import { configuredAppURL } from './appPath';

export function bottleUrl(wineId, appUrl = configuredAppURL()) {
  return `${appUrl}/q/${encodeURIComponent(wineId)}`;
}

// SVG inline (fără imagini externe), corecție de erori M: rezistă la etichete ușor pătate
export async function qrSvg(text) {
  return QRCode.toString(text, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#000000', light: '#ffffff' } });
}

export const MAX_LABELS = 48;
