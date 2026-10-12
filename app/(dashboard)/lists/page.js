import Link from 'next/link';
import prisma from '@/utils/db';
import { headers } from 'next/headers';
import { auth } from '@/utils/auth';
import { getLists } from '@/utils/actions';
import ListsManager from '@/components/lists/ListsManager';

export const metadata = { title: 'Liste — Vinerys' };

export default async function ListsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [lists, wines] = await Promise.all([
    getLists(),
    prisma.wine.findMany({ where: { userId: session.user.id }, select: { id: true, name: true, vintage: true }, orderBy: { name: 'asc' } }),
  ]);
  return (
    <main style={{ minHeight: '100vh', background: '#0d0608', color: '#f5e6e8', padding: '6rem 1.25rem 4rem', fontFamily: 'Jost, system-ui, sans-serif' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <Link href="/wines" style={{ color: 'rgba(245,230,232,0.6)', fontSize: '0.75rem', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.12em' }}>← Pivniță</Link>
        <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontWeight: 300, fontSize: '2.4rem', margin: '1rem 0 0.25rem' }}>Liste</h1>
        <p style={{ color: 'rgba(245,230,232,0.7)', fontSize: '0.92rem', marginTop: 0 }}>Wishlist, recomandări pentru prieteni sau lista de cadouri. O listă publică are un link pe care îl poți trimite.</p>
        <ListsManager lists={lists} wines={wines} />
      </div>
    </main>
  );
}
