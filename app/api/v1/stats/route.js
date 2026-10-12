import { NextResponse } from 'next/server';
import { apiRoute } from '@/server/api';
import { dashboardStats } from '@/server/wines';

export const GET = apiRoute('stats', async (_request, { user }) => NextResponse.json(await dashboardStats(user.id)));
