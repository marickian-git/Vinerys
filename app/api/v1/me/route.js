import { NextResponse } from 'next/server';
import prisma from '@/utils/db';
import { apiRoute } from '@/server/api';

export const GET = apiRoute('me', async (_request, { user }) => {
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, name: true, email: true, emailVerified: true, image: true, role: true, cellarName: true, createdAt: true },
  });
  return NextResponse.json({ user: profile });
});
