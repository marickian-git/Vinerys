import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';
import SettingsClient from '@/components/SettingsClient';

export const metadata = { title: 'Setări — Vinerys' };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user ? await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { shareId: true, aiProvider: true, aiApiKey: true },
  }) : null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const shareUrl = user?.shareId ? `${appUrl}/crama/${user.shareId}` : null;
  const aiProvider = user?.aiProvider || 'gemini';
  const aiHasKey = !!user?.aiApiKey;

  return <SettingsClient shareUrl={shareUrl} aiProvider={aiProvider} aiHasKey={aiHasKey} />;
}