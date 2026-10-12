// DATA-003: degustare. Aceleași reguli în formular și pe server.
import { z } from 'zod';

const shortText = (max) => z.string().trim().max(max).optional().nullable().transform((value) => value || null);
const list = (maxItems, maxLength) => z.array(z.string().trim().max(maxLength)).max(maxItems).default([]);

export const TastingInputSchema = z.object({
  wineId: z.string().min(1, 'Alege vinul'),
  tastedAt: z.coerce.date().max(new Date(Date.now() + 24 * 60 * 60 * 1000), 'Data e în viitor').optional(),
  rating: z.preprocess((value) => (value === '' || value == null ? null : Number(value)), z.number().int().min(1).max(5).nullable()),
  occasion: shortText(80),
  people: list(12, 60),
  food: shortText(200),
  location: shortText(120),
  notes: shortText(4000),
  photoUrls: z.array(z.string().url()).max(6, 'Maximum 6 poze').default([]),
  aromas: list(20, 40),
});
