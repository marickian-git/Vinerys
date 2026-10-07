import { appPath } from './appPath';

const BUCKET_MARKER = '/vinerys/';
export const THUMB_WIDTHS = [96, 240, 480, 960];

// Orice URL MinIO salvat în DB → proxy-ul intern /api/media (cu verificare de acces și resize opțional)
export function getDisplayImageUrl(value, { width } = {}) {
  if (!value) return value;
  try {
    const url = new URL(value);
    const index = url.pathname.indexOf(BUCKET_MARKER);
    if (index === -1) return value;
    const key = decodeURIComponent(url.pathname.slice(index + BUCKET_MARKER.length));
    const path = appPath(`/api/media/${key}`);
    return width && THUMB_WIDTHS.includes(width) ? `${path}?w=${width}` : path;
  } catch {
    return value;
  }
}
