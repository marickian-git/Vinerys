import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { auth } from '@/utils/auth';
import { BUCKET, ensureBucket, getMinioClient, getPublicUrl } from '@/utils/minio';
import { UPLOAD_FOLDERS } from '@/utils/storage';
import { LIMITS, rateLimit, tooManyRequestsMessage } from '@/utils/rateLimit';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB la intrare; după procesare rămân câteva sute de KB
const MAX_DIMENSION = 2000;

export async function POST(request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
  }

  const limited = rateLimit(`upload:${session.user.id}`, LIMITS.upload);
  if (!limited.ok) {
    return NextResponse.json(
      { error: tooManyRequestsMessage(limited.retryAfter) },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } },
    );
  }

  let file, folder;
  try {
    const formData = await request.formData();
    file = formData.get('file');
    folder = formData.get('folder')?.toString() || 'wines/labels';
  } catch {
    return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
  }

  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Niciun fișier primit' }, { status: 400 });
  }
  if (!UPLOAD_FOLDERS.includes(folder)) {
    return NextResponse.json({ error: 'Destinație invalidă' }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Fișierul e prea mare. Maximum 10MB.' }, { status: 400 });
  }

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
    return NextResponse.json({ error: 'Fișierul nu este o imagine validă' }, { status: 400 });
  }

  const objectName = `${folder}/${session.user.id}_${Date.now()}_${randomBytes(6).toString('hex')}.webp`;

  try {
    await ensureBucket();
    await getMinioClient().putObject(BUCKET, objectName, output, output.length, { 'Content-Type': 'image/webp' });
  } catch (error) {
    console.error('[upload] storage error:', error.message);
    return NextResponse.json({ error: 'Eroare la salvarea imaginii' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    url: getPublicUrl(objectName),
    objectName,
    size: output.length,
    type: 'image/webp',
  });
}
