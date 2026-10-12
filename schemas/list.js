// SOCIAL-003: liste de vinuri
import { z } from 'zod';

export const LIST_KINDS = ['WISHLIST', 'RECOMMENDATIONS', 'GIFTS'];
const text = (max) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);

export const ListInputSchema = z.object({
  name: z.string().trim().min(1, 'Dă-i un nume listei').max(80),
  description: text(500),
  kind: z.enum(LIST_KINDS).default('WISHLIST'),
  isPublic: z.boolean().default(false),
});

export const ListItemInputSchema = z.object({
  wineId: z.string().optional().nullable(),
  name: z.string().trim().max(120).optional(),
  producer: text(120),
  vintage: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().int().min(1800).max(2100).nullable()),
  note: text(300),
  url: z.string().trim().url('Link invalid').max(500).optional().nullable().or(z.literal('').transform(() => null)),
}).refine((item) => item.wineId || item.name, { message: 'Alege un vin sau scrie un nume', path: ['name'] });

export const ReserveSchema = z.object({ name: z.string().trim().min(2, 'Scrie-ți numele').max(60) });
