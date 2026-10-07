// Găsește (și opțional șterge) imaginile din MinIO pe care nu le mai referă niciun vin sau avatar.
// Implicit rulează în modul dry-run:  node scripts/cleanup-orphan-images.mjs
// Ștergere efectivă (doar fișiere mai vechi de 24h): node scripts/cleanup-orphan-images.mjs --delete
import 'dotenv/config';
import { Client } from 'minio';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DELETE = process.argv.includes('--delete');
const MIN_AGE_MS = 24 * 60 * 60 * 1000; // protejează upload-urile încă nesalvate în formular
const BUCKET = process.env.MINIO_BUCKET || 'vinerys';

for (const name of ['DATABASE_URL', 'MINIO_ENDPOINT', 'MINIO_ACCESS_KEY', 'MINIO_SECRET_KEY']) {
  if (!process.env[name]) throw new Error(`${name} nu este configurat`);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const minio = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: process.env.MINIO_PORT ? Number.parseInt(process.env.MINIO_PORT, 10) : undefined,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

function keyFromUrl(value) {
  try {
    const { pathname } = new URL(value);
    const index = pathname.indexOf(`/${BUCKET}/`);
    return index === -1 ? null : decodeURIComponent(pathname.slice(index + BUCKET.length + 2));
  } catch {
    return null;
  }
}

const [wines, users] = await Promise.all([
  prisma.wine.findMany({ select: { labelImageUrl: true, bottleImageUrl: true } }),
  prisma.user.findMany({ select: { image: true } }),
]);
const referenced = new Set(
  [...wines.flatMap((w) => [w.labelImageUrl, w.bottleImageUrl]), ...users.map((u) => u.image)]
    .map(keyFromUrl)
    .filter(Boolean),
);

const orphans = [];
let total = 0;
for await (const item of minio.listObjectsV2(BUCKET, '', true)) {
  total += 1;
  if (!referenced.has(item.name)) orphans.push(item);
}

const now = Date.now();
const deletable = orphans.filter((item) => now - new Date(item.lastModified).getTime() > MIN_AGE_MS);
const bytes = deletable.reduce((sum, item) => sum + (item.size || 0), 0);

console.log(`Obiecte în bucket: ${total} · referite: ${referenced.size} · orfane: ${orphans.length} (${deletable.length} mai vechi de 24h, ${(bytes / 1024 / 1024).toFixed(1)} MB)`);
for (const item of deletable) console.log(`  orfan: ${item.name}`);

if (DELETE && deletable.length) {
  await minio.removeObjects(BUCKET, deletable.map((item) => item.name));
  console.log(`Șterse: ${deletable.length}`);
} else if (deletable.length) {
  console.log('Dry-run: rulează cu --delete pentru ștergere.');
}

await prisma.$disconnect();
