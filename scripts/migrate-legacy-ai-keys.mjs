// SEC-006: mută cheile AI vechi (user.aiApiKey, plaintext) în AIAgent criptat, apoi golește coloana.
// Dry-run implicit: node scripts/migrate-legacy-ai-keys.mjs   ·   aplicare: --apply
// Cheile nu sunt afișate niciodată.
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { decryptSecret, encryptSecret } from '../utils/aiSecrets.js';

const APPLY = process.argv.includes('--apply');
const KNOWN = new Set(['gemini', 'groq', 'openrouter', 'claude', 'openai']);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const users = await prisma.user.findMany({
  where: { aiApiKey: { not: null } },
  select: { id: true, aiProvider: true, aiApiKey: true, aiAgents: { select: { encryptedApiKey: true } } },
});

for (const user of users) {
  const legacyKey = user.aiApiKey.trim();
  const duplicate = user.aiAgents.some((agent) => {
    try { return decryptSecret(agent.encryptedApiKey) === legacyKey; } catch { return false; }
  });
  const provider = KNOWN.has(user.aiProvider) ? user.aiProvider : 'gemini';
  const action = !legacyKey ? 'gol → doar golire' : duplicate ? 'există deja ca agent → doar golire' : `agent nou dezactivat (${provider})`;
  console.log(`user ${user.id}: ${action}`);
  if (!APPLY) continue;

  await prisma.$transaction(async (tx) => {
    if (legacyKey && !duplicate) {
      await tx.aIAgent.create({
        data: {
          userId: user.id,
          name: 'Cheie veche (migrată)',
          provider,
          providerType: 'preset',
          encryptedApiKey: encryptSecret(legacyKey),
          enabled: false, // userul o verifică și o activează din Setări
          priority: 99,
          lastStatus: 'Needs attention',
          lastError: 'Migrată din setările vechi: verifică providerul și modelul înainte de activare',
        },
      });
    }
    await tx.user.update({ where: { id: user.id }, data: { aiApiKey: null } });
  });
}

console.log(APPLY ? `Aplicat pentru ${users.length} utilizator(i).` : `Dry-run: ${users.length} utilizator(i). Rulează cu --apply.`);
await prisma.$disconnect();
