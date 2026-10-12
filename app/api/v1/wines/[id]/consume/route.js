import { NextResponse } from 'next/server';
import { z } from 'zod';
import { apiRoute, readJson } from '@/server/api';
import { consumeWineForUser } from '@/server/wines';
import { validationError } from '@/utils/errors';

const ConsumeSchema = z.object({ quantity: z.number().int().min(1).max(100).default(1) });

// POST /api/v1/wines/:id/consume { quantity } → { remaining }
export const POST = apiRoute('consume', async (request, { user, params }) => {
  const { quantity } = await readJson(request, ConsumeSchema);
  const result = await consumeWineForUser(user.id, params.id, quantity);
  if (result.error) throw validationError(undefined, result.error);
  return NextResponse.json({ remaining: result.remaining });
});
