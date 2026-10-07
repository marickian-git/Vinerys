import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import prisma from '@/utils/db';
import { getAIAgents, getAIProviderCatalog } from '@/utils/actions';
import SettingsClient from '@/components/SettingsClient';
import { shareUrlFor } from '@/utils/share';

export const metadata = { title: 'Setări — Vinerys' };

export default async function SettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user ? await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { shareId: true, shareEnabled: true, aiProvider: true },
  }) : null;

  const shareUrl = shareUrlFor(user?.shareId);
  const shareEnabled = Boolean(user?.shareEnabled);
  const aiProvider = user?.aiProvider || 'gemini';
  const aiAgents = await getAIAgents();
  const aiProviders = await getAIProviderCatalog();

  return <SettingsClient shareUrl={shareUrl} shareEnabled={shareEnabled} aiProvider={aiProvider} aiAgents={aiAgents} aiProviders={aiProviders} />;
}