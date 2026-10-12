// CELLAR-008: raportul de valoare al pivniței, în moneda utilizatorului
import prisma from '../utils/db';
import { DEFAULT_CURRENCY, convert } from '../utils/currency';
import { portfolio } from '../utils/valuation';
import { getRates } from './fx';

export async function valueReportFor(userId) {
  const [user, wines] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { currency: true, name: true, cellarName: true } }),
    prisma.wine.findMany({
      where: { userId, status: 'IN_CELLAR', quantity: { gt: 0 } },
      select: { id: true, name: true, producer: true, vintage: true, type: true, quantity: true, status: true, purchasePrice: true, estimatedValue: true, currency: true, purchaseDate: true, cellarLocation: true, bottleSize: true },
      orderBy: { name: 'asc' },
    }),
  ]);
  const currency = user?.currency ?? DEFAULT_CURRENCY;
  const rates = wines.some((w) => w.currency !== currency) ? await getRates() : null;
  const converted = wines.map((w) => ({
    ...w,
    originalCurrency: w.currency,
    purchasePrice: convert(w.purchasePrice, w.currency, currency, rates),
    estimatedValue: convert(w.estimatedValue, w.currency, currency, rates),
    currency,
  }));
  return { currency, owner: user?.cellarName || user?.name || 'Pivnița mea', generatedAt: new Date().toISOString(), ...portfolio(converted) };
}
