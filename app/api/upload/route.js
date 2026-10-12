import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { auth } from '@/utils/auth';
import { BUCKET, ensureBucket, getMinioClient, getPublicUrl } from '@/utils/minio';
import { UPLOAD_FOLDERS } from '@/utils/storage';
import { LIMITS, rateLimit, tooManyRequestsMessage } from '@/utils/rateLimit';
import { AppError, rateLimited, unauthenticated, validationError, withApiHandler } from '@/utils/errors';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB la intrare; după procesare rămân câteva sute de KB
const MAX_DIMENSION = 2000;

export const POST = withApiHandler('upload', async (request) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw unauthenticated();

  const limited = rateLimit(`upload:${session.user.id}`, LIMITS.upload);
  if (!limited.ok) throw rateLimited(tooManyRequestsMessage(limited.retryAfter), limited.retryAfter);

  let file, folder;
  try {
    const formData = await request.formData();
    file = formData.get('file');
    folder = formData.get('folder')?.toString() || 'wines/labels';
  } catch {
    throw validationError(undefined, 'Date invalide');
  }

  if (!file || typeof file.arrayBuffer !== 'function') throw validationError(undefined, 'Niciun fișier primit');
  if (!UPLOAD_FOLDERS.includes(folder)) throw validationError(undefined, 'Destinație invalidă');
  if (file.size > MAX_SIZE) throw validationError(undefined, 'Fișierul e prea mare. Maximum 10MB.');

  // sharp verifică tipul real (nu doar extensia/MIME-ul declarat), elimină EXIF/GPS și normalizează la WebP
  let output;
  try {
    const input = Buffer.from(await file.arrayBuffer());
    output = await sharp(input, { limitInputPixels: 50_000_000 })
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw validationError(undefined, 'Fișierul nu este o imagine validă');
  }

  const objectName = `${folder}/${session.user.id}_${Date.now()}_${randomBytes(6).toString('hex')}.webp`;

  try {
    await ensureBucket();
    await getMinioClient().putObject(BUCKET, objectName, output, output.length, { 'Content-Type': 'image/webp' });
  } catch (error) {
    throw new AppError('STORAGE_FAILED', { message: 'minio putObject failed', userMessage: 'Eroare la salvarea imaginii', cause: error });
  }

  return NextResponse.json({
    success: true,
    url: getPublicUrl(objectName),
    objectName,
    size: output.length,
    type: 'image/webp',
  });
});
