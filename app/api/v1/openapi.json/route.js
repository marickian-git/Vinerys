import { NextResponse } from 'next/server';
import { openApiSpec } from '@/server/openapi';
import { configuredAppURL } from '@/utils/appPath';

// Public: descrierea API-ului (fără date)
export function GET() {
  return NextResponse.json(openApiSpec(configuredAppURL()));
}
