// Scheme pentru agenții AI și cererea de scanare (ARCH-007)
import { z } from 'zod';

const clamp = (min, max, fallback) => z.preprocess(
  (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number !== 0 ? number : fallback;
  },
  z.number().transform((value) => Math.min(max, Math.max(min, value))),
);

export const AIAgentInputSchema = z.object({
  id: z.string().nullish(),
  name: z.string({ error: 'Numele agentului este obligatoriu și are maximum 80 de caractere' })
    .trim()
    .min(1, 'Numele agentului este obligatoriu și are maximum 80 de caractere')
    .max(80, 'Numele agentului este obligatoriu și are maximum 80 de caractere'),
  provider: z.string({ error: 'Provider AI invalid' }),
  providerType: z.string().nullish(),
  model: z.string({ error: 'Model ID este obligatoriu. Poți introduce manual modelul.' })
    .trim()
    .min(1, 'Model ID este obligatoriu. Poți introduce manual modelul.'),
  baseUrl: z.string().trim().nullish(),
  apiKey: z.string().trim().nullish(),
  billingType: z.string().nullish(),
  capabilities: z.record(z.string(), z.unknown()).optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
  enabled: z.boolean().nullish(),
  priority: z.preprocess((value) => Math.max(0, Number(value) || 0), z.number()),
  timeoutMs: clamp(3000, 60000, 20000),
  // Ca înainte: 0 sau lipsă înseamnă valoarea implicită (1)
  maxRetries: z.preprocess((value) => Math.min(3, Math.max(0, Number(value) || 1)), z.number()),
  weight: clamp(0.1, 10, 1),
});

// Corpul cererii /api/ai-scan. imageBase64 are o limită ca să nu primim payload-uri uriașe
export const ScanRequestSchema = z.object({
  imageBase64: z.string({ error: 'Lipsește imaginea (imageBase64)' })
    .min(1, 'Lipsește imaginea (imageBase64)')
    .max(15_000_000, 'Imaginea e prea mare'),
  mimeType: z.string().regex(/^image\/[\w.+-]+$/, 'Tip de imagine invalid').default('image/jpeg'),
});
