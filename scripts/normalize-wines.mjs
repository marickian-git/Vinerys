// DATA-010: normalizează vinurile existente (țări, locații, arome, liste, culoare derivată).
// Dry-run implicit:  node scripts/normalize-wines.mjs
// Aplicare:          node scripts/normalize-wines.mjs --apply   (scrie întâi un backup JSON cu rândurile modificate)
// Opțional:          --backup-dir=../vinerys-backups
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { dedupeLocations, normalizeWineData } from '../utils/normalize.js';

const APPLY = process.argv.includes('--apply');
const BACKUP_DIR = process.argv.find((arg) => arg.startsWith('--backup-dir='))?.split('=')[1] ?? 'backups';
const FIELDS = ['name', 'producer', 'region', 'subregion', 'country', 'cellarLocation', 'grapeVarieties', 'foodPairing', 'aromaProfile', 'color', 'tastingNotes', 'servingTemperature', 'agingPotential'];

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const wines = await prisma.wine.findMany({ select: { id: true, userId: true, type: true, ...Object.fromEntries(FIELDS.map((f) => [f, true])) } });
const locationsByUser = new Map();
for (const wine of wines) {
  locationsByUser.set(wine.userId, [...(locationsByUser.get(wine.userId) ?? []), wine.cellarLocation]);
}
for (const [userId, values] of locationsByUser) locationsByUser.set(userId, dedupeLocations(values));

const distinct = (rows, field) => new Set(rows.flatMap((row) => (Array.isArray(row[field]) ? row[field] : [row[field]])).filter(Boolean)).size;

const changes = [];
for (const wine of wines) {
  const input = Object.fromEntries(FIELDS.map((field) => [field, wine[field]]));
  const next = normalizeWineData({ ...input, type: wine.type }, { existingLocations: locationsByUser.get(wine.userId) });
  const diff = {};
  for (const field of FIELDS) {
    if (JSON.stringify(wine[field] ?? null) !== JSON.stringify(next[field] ?? null)) diff[field] = { from: wine[field] ?? null, to: next[field] ?? null };
  }
  if (Object.keys(diff).length) changes.push({ id: wine.id, userId: wine.userId, diff, before: wine, after: next });
}

console.log(`Vinuri: ${wines.length} · de modificat: ${changes.length}`);
for (const field of FIELDS) {
  const count = changes.filter((change) => field in change.diff).length;
  if (count) console.log(`  ${field.padEnd(18)} ${count} rânduri`);
}
const after = wines.map((wine) => changes.find((change) => change.id === wine.id)?.after ?? wine);
console.log('\nValori distincte înainte → după:');
for (const field of ['country', 'cellarLocation', 'aromaProfile', 'grapeVarieties']) {
  console.log(`  ${field.padEnd(18)} ${distinct(wines, field)} → ${distinct(after, field)}`);
}
console.log(`  color completată     ${wines.filter((w) => w.color).length} → ${after.filter((w) => w.color).length} din ${wines.length}`);

for (const change of changes.slice(0, 15)) {
  console.log(`\n${change.id}`);
  for (const [field, { from, to }] of Object.entries(change.diff)) console.log(`  ${field}: ${JSON.stringify(from)} → ${JSON.stringify(to)}`);
}
if (changes.length > 15) console.log(`\n… încă ${changes.length - 15}`);

if (!APPLY) {
  console.log('\nDry-run: nimic nu a fost scris. Rulează cu --apply ca să aplici.');
} else if (changes.length) {
  mkdirSync(BACKUP_DIR, { recursive: true });
  const file = join(BACKUP_DIR, `normalize-wines-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(file, JSON.stringify(changes.map(({ id, before }) => ({ id, before })), null, 2));
  console.log(`\nBackup: ${file}`);
  await prisma.$transaction(changes.map((change) => prisma.wine.update({
    where: { id: change.id },
    data: Object.fromEntries(Object.entries(change.diff).map(([field, { to }]) => [field, to])),
  })));
  console.log(`Aplicat: ${changes.length} vinuri actualizate.`);
}

await prisma.$disconnect();
