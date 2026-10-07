import { BUCKET, getMinioClient } from './minio';

export const UPLOAD_FOLDERS = ['wines/labels', 'wines/bottles', 'avatars'];

const KEY_PATTERN = /^(wines\/labels|wines\/bottles|avatars|wines)\/([A-Za-z0-9]+)_[A-Za-z0-9._-]+$/;

// Extrage cheia obiectului dintr-un URL salvat (http://host/minio/vinerys/<cheie codată>)
export function objectKeyFromUrl(value, bucket = BUCKET) {
  if (!value) return null;
  try {
    const { pathname } = new URL(value);
    const marker = `/${bucket}/`;
    const index = pathname.indexOf(marker);
    if (index === -1) return null;
    return parseObjectKey(decodeURIComponent(pathname.slice(index + marker.length)))?.key ?? null;
  } catch {
    return null;
  }
}

// Validează o cheie și întoarce proprietarul (userId-ul din prefixul numelui fișierului)
export function parseObjectKey(key) {
  if (typeof key !== 'string' || key.includes('..')) return null;
  const match = key.match(KEY_PATTERN);
  return match ? { key, folder: match[1], ownerId: match[2] } : null;
}

// Best-effort: o imagine rămasă nu trebuie să blocheze ștergerea unui vin/cont
export async function removeObjects(keys) {
  const unique = [...new Set(keys.filter(Boolean))];
  if (!unique.length) return;
  try {
    await getMinioClient().removeObjects(BUCKET, unique);
  } catch (error) {
    console.error('[storage] remove failed:', error.message);
  }
}

export async function listUserObjects(userId) {
  const minio = getMinioClient();
  const keys = [];
  for (const folder of [...UPLOAD_FOLDERS, 'wines']) {
    const stream = minio.listObjectsV2(BUCKET, `${folder}/${userId}_`, false);
    for await (const item of stream) if (item.name) keys.push(item.name);
  }
  return keys;
}
