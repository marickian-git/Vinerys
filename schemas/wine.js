// Scheme Zod comune pentru vin (ARCH-007). Fără dependențe de server: se pot importa și în componente client.
import { z } from 'zod';

export const WINE_TYPES = ['RED', 'WHITE', 'ROSE', 'SPARKLING', 'DESSERT', 'FORTIFIED'];
export const WINE_COLORS = ['RED', 'WHITE', 'ROSE', 'ORANGE'];
export const WINE_STATUSES = ['IN_CELLAR', 'CONSUMED', 'SOLD', 'GIFTED'];

export const WineTypeSchema = z.enum(WINE_TYPES);
export const WineColorSchema = z.enum(WINE_COLORS);
export const WineStatusSchema = z.enum(WINE_STATUSES);

// Schema formularului de vin: aceleași reguli în client (validare înainte de submit) și pe server
export const WineInputSchema = z.object({
  name: z.string().min(1, 'Numele este obligatoriu'),
  producer: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  subregion: z.string().optional(),
  type: WineTypeSchema,
  color: WineColorSchema.optional(),
  vintage: z.coerce.number().min(1800).max(new Date().getFullYear()).optional(),
  grapeVarieties: z.array(z.string()).default([]),
  alcoholPercentage: z.coerce.number().min(0).max(100).optional(),
  quantity: z.coerce.number().min(0).default(1),
  cellarLocation: z.string().optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  estimatedValue: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  tastingNotes: z.string().optional(),
  servingTemperature: z.string().optional(),
  foodPairing: z.array(z.string()).default([]),
  agingPotential: z.string().optional(),
  aromaProfile: z.array(z.string()).default([]),
  drinkFrom: z.coerce.number().min(1900).max(2100).optional().nullable(),
  drinkUntil: z.coerce.number().min(1900).max(2100).optional().nullable(),
  bottleSize: z.string().default('0.75L'),
  bottleImageUrl: z.string().url().optional().or(z.literal('')),
  labelImageUrl: z.string().url().optional().or(z.literal('')),
  // z.coerce.boolean('false') ar da true: formularul trimite booleenii ca text
  isFavorite: z.preprocess((value) => value === true || value === 'true' || value === 'on' || value === '1', z.boolean()),
  consumptionDate: z.coerce.date().optional(),
  status: WineStatusSchema.default('IN_CELLAR'),
});

const ARRAY_FIELDS = ['grapeVarieties', 'foodPairing', 'aromaProfile'];

function parseJsonArray(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// FormData (sau obiect simplu) → intrare pentru WineInputSchema: listele vin ca JSON, anii ca text
export function wineInputFromFormData(formData) {
  const raw = typeof formData?.entries === 'function' ? Object.fromEntries(formData.entries()) : { ...formData };
  for (const field of ARRAY_FIELDS) {
    raw[field] = Array.isArray(raw[field]) ? raw[field] : parseJsonArray(raw[field]);
  }
  raw.drinkFrom = raw.drinkFrom ? Number.parseInt(raw.drinkFrom, 10) : undefined;
  raw.drinkUntil = raw.drinkUntil ? Number.parseInt(raw.drinkUntil, 10) : undefined;
  return raw;
}

// Rezultat gata de scris în DB, sau { error } cu erorile pe câmpuri (forma folosită de WineForm)
export function parseWineForm(formData) {
  const parsed = WineInputSchema.safeParse(wineInputFromFormData(formData));
  if (!parsed.success) return { error: z.flattenError(parsed.error).fieldErrors };
  return {
    data: {
      ...parsed.data,
      bottleImageUrl: parsed.data.bottleImageUrl || null,
      labelImageUrl: parsed.data.labelImageUrl || null,
      drinkFrom: parsed.data.drinkFrom ?? null,
      drinkUntil: parsed.data.drinkUntil ?? null,
    },
  };
}
