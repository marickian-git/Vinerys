// Imagini din MinIO folosite de vinuri, avatare și degustări (ARCH-006: logică de domeniu, fără Next).
import prisma from '../utils/db';
import { objectKeyFromUrl, removeObjects } from '../utils/storage';

// Șterge din MinIO imaginile care nu mai sunt referite de niciun vin, avatar sau degustare
export async function releaseImages(urls) {
  const keys = [];
  for (const url of new Set(urls.filter(Boolean))) {
    const key = objectKeyFromUrl(url);
    if (!key) continue;
    const [wineRefs, userRefs, tastingRefs] = await Promise.all([
      prisma.wine.count({ where: { OR: [{ labelImageUrl: url }, { bottleImageUrl: url }] } }),
      prisma.user.count({ where: { image: url } }),
      prisma.tasting.count({ where: { photoUrls: { has: url } } }),
    ]);
    if (wineRefs + userRefs + tastingRefs === 0) keys.push(key);
  }
  await removeObjects(keys);
}
