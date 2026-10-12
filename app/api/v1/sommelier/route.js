import { NextResponse } from 'next/server';
import { apiRoute } from '@/server/api';
import { askSommelier } from '@/utils/actions';
import { validationError } from '@/utils/errors';

// POST /api/v1/sommelier { messages: [{ role, content }] } → { answer, wines, tools }
export const POST = apiRoute('sommelier', async (request) => {
  const body = await request.json().catch(() => ({}));
  const result = await askSommelier(body.messages);
  if (result.error) throw validationError(undefined, result.error);
  return NextResponse.json(result);
});
