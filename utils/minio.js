import { Client } from 'minio';

// Configurația vine exclusiv din environment: fără credențiale sau hostname-uri default
function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} nu este configurat`);
  return value;
}

let client;

export function getMinioClient() {
  if (!client) {
    client = new Client({
      endPoint: required('MINIO_ENDPOINT'),
      port: process.env.MINIO_PORT ? Number.parseInt(process.env.MINIO_PORT, 10) : undefined,
      useSSL: process.env.MINIO_USE_SSL === 'true',
      accessKey: required('MINIO_ACCESS_KEY'),
      secretKey: required('MINIO_SECRET_KEY'),
    });
  }
  return client;
}

export const BUCKET = process.env.MINIO_BUCKET || 'vinerys';

// Creează bucket-ul dacă lipsește. Nu îl mai face public: imaginile se servesc prin /api/media
export async function ensureBucket() {
  const minio = getMinioClient();
  if (!(await minio.bucketExists(BUCKET))) await minio.makeBucket(BUCKET, '');
}

// URL-ul salvat în DB (format istoric, păstrat pentru compatibilitate). Afișarea trece prin getDisplayImageUrl.
export function getPublicUrl(objectName) {
  const fallback = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT}${process.env.MINIO_PORT ? `:${process.env.MINIO_PORT}` : ''}`;
  const publicBase = (process.env.MINIO_PUBLIC_URL || fallback).replace(/\/+$/, '');
  return `${publicBase}/${BUCKET}/${encodeURIComponent(objectName)}`;
}
