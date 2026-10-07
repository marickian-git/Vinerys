import { headers } from 'next/headers';
import sharp from 'sharp';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';
import { BUCKET, getMinioClient } from '@/utils/minio';
import { parseObjectKey } from '@/utils/storage';
import { THUMB_WIDTHS } from '@/utils/mediaUrl';

const notFound = () => new Response('Not found', { status: 404 });

async function canRead(ownerId) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user?.id === ownerId) return true;
  // Imaginile unei colecții publice sunt vizibile pe pagina de share
  const owner = await prisma.user.findFirst({ where: { id: ownerId, shareEnabled: true }, select: { id: true } });
  return Boolean(owner);
}

export async function GET(request, { params }) {
  const { key: segments } = await params;
  const object = parseObjectKey(segments.join('/'));
  if (!object || !(await canRead(object.ownerId))) return notFound();

  let buffer, contentType;
  try {
    const minio = getMinioClient();
    const stat = await minio.statObject(BUCKET, object.key);
    const stream = await minio.getObject(BUCKET, object.key);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    buffer = Buffer.concat(chunks);
    contentType = stat.metaData?.['content-type'] || 'application/octet-stream';
  } catch (error) {
    if (error.code !== 'NotFound' && error.code !== 'NoSuchKey') console.error('[media] read failed:', error.message);
    return notFound();
  }

  const width = Number.parseInt(new URL(request.url).searchParams.get('w'), 10);
  if (THUMB_WIDTHS.includes(width)) {
    try {
      buffer = await sharp(buffer).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 78 }).toBuffer();
      contentType = 'image/webp';
    } catch {
      // Imagine pe care sharp nu o poate procesa: servim originalul
    }
  }

  return new Response(buffer, {
    headers: {
      'Content-Type': contentType,
      // Numele obiectelor sunt unice (timestamp), deci conținutul nu se schimbă
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
