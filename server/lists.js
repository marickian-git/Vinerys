// SOCIAL-003: liste de vinuri (wishlist, recomandări, cadouri) și pagina lor publică
import { randomBytes } from 'node:crypto';
import prisma from '../utils/db';
import { forbidden, notFound } from '../utils/errors';

const newShareId = () => randomBytes(12).toString('base64url');
const ITEM_ORDER = [{ position: 'asc' }, { createdAt: 'asc' }];

export function listsFor(userId) {
  return prisma.wineList.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: { items: { orderBy: ITEM_ORDER } },
  });
}

async function ownList(userId, listId) {
  const list = await prisma.wineList.findUnique({ where: { id: listId } });
  if (!list) throw notFound('Lista nu a fost găsită');
  if (list.userId !== userId) throw forbidden();
  return list;
}

export function createList(userId, data) {
  return prisma.wineList.create({ data: { ...data, userId, shareId: newShareId() } });
}

export async function updateList(userId, listId, data) {
  await ownList(userId, listId);
  return prisma.wineList.update({ where: { id: listId }, data });
}

export async function deleteList(userId, listId) {
  await ownList(userId, listId);
  await prisma.wineList.delete({ where: { id: listId } });
}

export async function addItem(userId, listId, item) {
  await ownList(userId, listId);
  let fields = { name: item.name, producer: item.producer, vintage: item.vintage };
  if (item.wineId) {
    const wine = await prisma.wine.findFirst({ where: { id: item.wineId, userId }, select: { id: true, name: true, producer: true, vintage: true } });
    if (!wine) throw notFound('Vinul nu a fost găsit');
    fields = { name: wine.name, producer: wine.producer, vintage: wine.vintage };
  }
  const position = await prisma.wineListItem.count({ where: { listId } });
  return prisma.wineListItem.create({ data: { listId, wineId: item.wineId || null, note: item.note, url: item.url, position, ...fields } });
}

export async function removeItem(userId, itemId) {
  const item = await prisma.wineListItem.findUnique({ where: { id: itemId }, include: { list: { select: { userId: true } } } });
  if (!item || item.list.userId !== userId) throw notFound('Elementul nu a fost găsit');
  await prisma.wineListItem.delete({ where: { id: itemId } });
}

export async function togglePurchased(userId, itemId) {
  const item = await prisma.wineListItem.findUnique({ where: { id: itemId }, include: { list: { select: { userId: true } } } });
  if (!item || item.list.userId !== userId) throw notFound('Elementul nu a fost găsit');
  return prisma.wineListItem.update({ where: { id: itemId }, data: { purchased: !item.purchased } });
}

// Pagina publică: doar listele publice; numele celui care a rezervat nu se arată nimănui
export async function publicList(shareId) {
  const list = await prisma.wineList.findFirst({
    where: { shareId, isPublic: true },
    include: { user: { select: { name: true, cellarName: true } }, items: { orderBy: ITEM_ORDER } },
  });
  if (!list) return null;
  return {
    name: list.name,
    description: list.description,
    kind: list.kind,
    owner: list.user.cellarName || list.user.name,
    items: list.items.map(({ id, name, producer, vintage, note, url, reservedAt, purchased }) => ({ id, name, producer, vintage, note, url, reserved: Boolean(reservedAt), purchased })),
  };
}

// Rezervare de cadou de către un vizitator (fără cont); prima rezervare câștigă
export async function reserveItem(shareId, itemId, reservedBy) {
  const { count } = await prisma.wineListItem.updateMany({
    where: { id: itemId, reservedAt: null, list: { shareId, isPublic: true, kind: 'GIFTS' } },
    data: { reservedBy, reservedAt: new Date() },
  });
  return count === 1;
}
