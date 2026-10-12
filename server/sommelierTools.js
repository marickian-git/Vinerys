// AI-002: tool-urile prin care AI-ul interoghează pivnița reală a utilizatorului.
// Protocol independent de provider: modelul cere un tool în JSON ({"tool": "...", "args": {...}}),
// serverul îl execută pe datele utilizatorului și îi dă înapoi rezultatul compact.
import { z } from 'zod';
import prisma from '../utils/db';
import { listWines, getWineForUser } from './wines';
import { tasteProfileFor } from './taste';
import { urgencyScore } from '../utils/foodToWine';
import { WINE_TYPES } from '../schemas/wine';

const compact = (wine) => ({
  id: wine.id, name: wine.name, producer: wine.producer ?? undefined, vintage: wine.vintage ?? undefined, type: wine.type,
  grapes: wine.grapeVarieties?.length ? wine.grapeVarieties : undefined, region: wine.region ?? undefined, country: wine.country ?? undefined,
  price: wine.purchasePrice ?? undefined, currency: wine.purchasePrice != null ? wine.currency : undefined,
  bottles: wine.quantity, status: wine.status, drinkFrom: wine.drinkFrom ?? undefined, drinkUntil: wine.drinkUntil ?? undefined,
  location: wine.cellarLocation ?? undefined, rating: wine.rating ?? undefined,
});

export const SOMMELIER_TOOLS = {
  searchWines: {
    description: 'Search the user\'s wines. query accepts natural language (Romanian or English), e.g. "roșii gata de băut sub 100 lei", grape, region or producer names. Returns at most `limit` wines.',
    args: z.object({
      query: z.string().max(200).optional(),
      type: z.enum(WINE_TYPES).optional(),
      maxPrice: z.number().positive().optional(),
      inCellarOnly: z.boolean().default(true),
      limit: z.number().int().min(1).max(20).default(10),
    }),
    run: async (userId, args) => {
      const filters = { search: args.query ?? '', type: args.type ?? '', priceMax: args.maxPrice ? String(args.maxPrice) : '', pageSize: String(args.limit) };
      if (args.inCellarOnly) filters.status = 'IN_CELLAR';
      const { wines, total } = await listWines(userId, filters);
      return { total, wines: wines.filter((w) => !args.inCellarOnly || w.quantity > 0).map(compact) };
    },
  },
  getWine: {
    description: 'Full details of one wine by id (tasting notes, aromas, food pairings, drinking window).',
    args: z.object({ id: z.string().min(1) }),
    run: async (userId, { id }) => {
      const wine = await getWineForUser(userId, id);
      return { ...compact(wine), tastingNotes: wine.tastingNotes ?? undefined, aromas: wine.aromaProfile, foodPairing: wine.foodPairing, servingTemperature: wine.servingTemperature ?? undefined };
    },
  },
  getAvailableBottles: {
    description: 'All bottles currently in the cellar, most urgent to drink first (urgency 0–1).',
    args: z.object({ type: z.enum(WINE_TYPES).optional(), limit: z.number().int().min(1).max(40).default(25) }),
    run: async (userId, { type, limit }) => {
      const wines = await prisma.wine.findMany({ where: { userId, status: 'IN_CELLAR', quantity: { gt: 0 }, ...(type && { type }) } });
      return {
        wines: wines
          .map((w) => ({ ...compact(w), urgency: urgencyScore(w) }))
          .sort((a, b) => b.urgency - a.urgency)
          .slice(0, limit),
      };
    },
  },
  getUserPreferences: {
    description: 'What the user likes and dislikes, learned from ratings, tastings and consumption.',
    args: z.object({}),
    run: async (userId) => {
      const { profile } = await tasteProfileFor(userId, { recommendations: 0 });
      const labels = (list) => list.map((e) => e.label ?? e.key);
      return {
        basedOnWines: profile.evidence,
        likes: { grapes: labels(profile.top.grape), types: labels(profile.top.type), regions: labels(profile.top.region), countries: labels(profile.top.country), aromaFamilies: labels(profile.top.aroma) },
        dislikes: labels(profile.avoid),
      };
    },
  },
};

// Descrierea tool-urilor pentru prompt (numele, ce fac, argumentele)
export function describeTools() {
  return Object.entries(SOMMELIER_TOOLS).map(([name, tool]) => {
    const shape = tool.args.shape ?? {};
    const args = Object.entries(shape).map(([key, schema]) => `${key}${schema.isOptional?.() ? '?' : ''}`).join(', ');
    return `- ${name}(${args}): ${tool.description}`;
  }).join('\n');
}

// Execută un apel de tool: validează argumentele, rulează pe datele utilizatorului, întoarce { result } sau { error }
export async function runTool(userId, name, rawArgs) {
  const tool = SOMMELIER_TOOLS[name];
  if (!tool) return { error: `Unknown tool ${name}` };
  const parsed = tool.args.safeParse(rawArgs ?? {});
  if (!parsed.success) return { error: `Invalid args: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` };
  try {
    return { result: await tool.run(userId, parsed.data) };
  } catch (error) {
    return { error: error.userMessage ?? 'Tool failed' };
  }
}
