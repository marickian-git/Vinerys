"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import prisma from "./db";
import { auth } from "./auth";

// ─────────────────────────────────────────
// HELPER - obține userul curent
// ─────────────────────────────────────────

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Neautentificat");
  }

  return session.user;
}

// ─────────────────────────────────────────
// VALIDARE - schema Zod pentru vin
// ─────────────────────────────────────────

const WineSchema = z.object({
  name: z.string().min(1, "Numele este obligatoriu"),
  producer: z.string().optional(),
  country: z.string().optional(),
  region: z.string().optional(),
  subregion: z.string().optional(),
  type: z.enum(["RED", "WHITE", "ROSE", "SPARKLING", "DESSERT", "FORTIFIED"]),
  color: z.enum(["RED", "WHITE", "ROSE", "ORANGE"]).optional(),
  vintage: z.coerce.number().min(1800).max(new Date().getFullYear()).optional(),
  grapeVarieties: z.array(z.string()).default([]),
  alcoholPercentage: z.coerce.number().min(0).max(100).optional(),
  quantity: z.coerce.number().min(0).default(1),
  cellarLocation: z.string().optional(),
  purchaseDate: z.coerce.date().optional(),
  purchasePrice: z.coerce.number().min(0).optional(),
  estimatedValue: z.coerce.number().min(0).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  tastingNotes: z.string().optional(),
  servingTemperature: z.string().optional(),
  foodPairing: z.array(z.string()).default([]),
  agingPotential: z.string().optional(),
  aromaProfile: z.array(z.string()).default([]),
  drinkFrom: z.coerce.number().min(1900).max(2100).optional().nullable(),
  drinkUntil: z.coerce.number().min(1900).max(2100).optional().nullable(),
  bottleSize: z.string().default("0.75L"),
  bottleImageUrl: z.string().url().optional().or(z.literal("")),
  labelImageUrl: z.string().url().optional().or(z.literal("")),
  isFavorite: z.coerce.boolean().default(false),
  consumptionDate: z.coerce.date().optional(),
  status: z.enum(["IN_CELLAR", "CONSUMED", "SOLD", "GIFTED"]).default("IN_CELLAR"),
});

// ─────────────────────────────────────────
// WINES - CRUD
// ─────────────────────────────────────────

export async function getWines(filters = {}) {
  const user = await getCurrentUser();

  const where = { userId: user.id };

  if (filters.type)    where.type    = filters.type;
  if (filters.status)  where.status  = filters.status;
  if (filters.country) where.country = { equals: filters.country, mode: 'insensitive' };

  if (filters.isFavorite === 'true') where.isFavorite = true;
  if (filters.vintage) where.vintage = parseInt(filters.vintage);
  if (filters.vintageMin || filters.vintageMax) {
    where.vintage = {};
    if (filters.vintageMin) where.vintage.gte = parseInt(filters.vintageMin);
    if (filters.vintageMax) where.vintage.lte = parseInt(filters.vintageMax);
  }
  if (filters.ratingMin) where.rating = { gte: parseInt(filters.ratingMin) };
  if (filters.priceMax)  where.purchasePrice = { lte: parseFloat(filters.priceMax) };

  if (filters.search) {
    where.OR = [
      { name:     { contains: filters.search, mode: 'insensitive' } },
      { producer: { contains: filters.search, mode: 'insensitive' } },
      { region:   { contains: filters.search, mode: 'insensitive' } },
      { country:  { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const SORT_MAP = {
    newest:       { createdAt: 'desc' },
    oldest:       { createdAt: 'asc'  },
    name_asc:     { name: 'asc'       },
    name_desc:    { name: 'desc'      },
    vintage_desc: { vintage: 'desc'   },
    vintage_asc:  { vintage: 'asc'    },
    price_desc:   { purchasePrice: 'desc' },
    price_asc:    { purchasePrice: 'asc'  },
    rating_desc:  { rating: 'desc'    },
    rating_asc:   { rating: 'asc'     },
  };
  const orderBy = SORT_MAP[filters.sort] ?? { createdAt: 'desc' };

  const PAGE_SIZE = parseInt(filters.pageSize) || 24;
  const page      = Math.max(1, parseInt(filters.page) || 1);
  const skip      = (page - 1) * PAGE_SIZE;

  const [wines, total] = await Promise.all([
    prisma.wine.findMany({ where, orderBy, skip, take: PAGE_SIZE }),
    prisma.wine.count({ where }),
  ]);

  return {
    wines,
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

export async function getWineCountries() {
  const user = await getCurrentUser();
  const results = await prisma.wine.findMany({
    where:   { userId: user.id, country: { not: null } },
    select:  { country: true },
    distinct: ['country'],
    orderBy: { country: 'asc' },
  });
  return results.map(r => r.country).filter(Boolean);
}

export async function getWineById(id) {
  const user = await getCurrentUser();

  const wine = await prisma.wine.findUnique({ where: { id } });

  if (!wine) throw new Error("Vinul nu a fost găsit");
  if (wine.userId !== user.id) throw new Error("Acces interzis");

  return wine;
}

export async function createWine(formData) {
  const user = await getCurrentUser();

  const raw = Object.fromEntries(formData.entries());

  const grapeVarieties = raw.grapeVarieties ? JSON.parse(raw.grapeVarieties) : [];
  const foodPairing    = raw.foodPairing    ? JSON.parse(raw.foodPairing)    : [];
  const aromaProfile   = raw.aromaProfile   ? JSON.parse(raw.aromaProfile)   : [];

  const parsed = WineSchema.safeParse({
    ...raw,
    grapeVarieties,
    foodPairing,
    aromaProfile,
    drinkFrom:  raw.drinkFrom  ? parseInt(raw.drinkFrom)  : undefined,
    drinkUntil: raw.drinkUntil ? parseInt(raw.drinkUntil) : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.wine.create({
    data: {
      ...parsed.data,
      userId: user.id,
      bottleImageUrl: parsed.data.bottleImageUrl || null,
      labelImageUrl:  parsed.data.labelImageUrl  || null,
      drinkFrom:      parsed.data.drinkFrom  ?? null,
      drinkUntil:     parsed.data.drinkUntil ?? null,
    },
  });

  revalidatePath("/wines");
  redirect("/wines");
}

export async function updateWine(id, formData) {
  const user = await getCurrentUser();

  const existing = await prisma.wine.findUnique({ where: { id } });
  if (!existing) throw new Error("Vinul nu a fost găsit");
  if (existing.userId !== user.id) throw new Error("Acces interzis");

  const raw = Object.fromEntries(formData.entries());

  const grapeVarieties = raw.grapeVarieties ? JSON.parse(raw.grapeVarieties) : [];
  const foodPairing    = raw.foodPairing    ? JSON.parse(raw.foodPairing)    : [];
  const aromaProfile   = raw.aromaProfile   ? JSON.parse(raw.aromaProfile)   : [];

  const parsed = WineSchema.safeParse({
    ...raw,
    grapeVarieties,
    foodPairing,
    aromaProfile,
    drinkFrom:  raw.drinkFrom  ? parseInt(raw.drinkFrom)  : undefined,
    drinkUntil: raw.drinkUntil ? parseInt(raw.drinkUntil) : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.wine.update({
    where: { id },
    data: {
      ...parsed.data,
      bottleImageUrl: parsed.data.bottleImageUrl || null,
      labelImageUrl:  parsed.data.labelImageUrl  || null,
      drinkFrom:      parsed.data.drinkFrom  ?? null,
      drinkUntil:     parsed.data.drinkUntil ?? null,
    },
  });

  revalidatePath("/wines");
  revalidatePath(`/wines/${id}`);
  redirect(`/wines/${id}`);
}

export async function deleteWine(id) {
  const user = await getCurrentUser();

  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine) throw new Error("Vinul nu a fost găsit");
  if (wine.userId !== user.id) throw new Error("Acces interzis");

  await prisma.wine.delete({ where: { id } });

  revalidatePath("/wines");
  redirect("/wines");
}

export async function toggleFavorite(id) {
  const user = await getCurrentUser();

  const wine = await prisma.wine.findUnique({ where: { id } });
  if (!wine || wine.userId !== user.id) throw new Error("Acces interzis");

  await prisma.wine.update({
    where: { id },
    data: { isFavorite: !wine.isFavorite },
  });

  revalidatePath("/wines");
  revalidatePath(`/wines/${id}`);
}

// ─────────────────────────────────────────
// STATISTICI pentru Dashboard
// ─────────────────────────────────────────

export async function getDashboardStats() {
  const user = await getCurrentUser();

  const [wines, totalQuantity, totalValue] = await Promise.all([
    prisma.wine.findMany({
      where: { userId: user.id },
      select: { type: true, country: true, status: true, quantity: true, purchasePrice: true, rating: true },
    }),
    prisma.wine.aggregate({
      where: { userId: user.id },
      _sum: { quantity: true },
    }),
    prisma.wine.aggregate({
      where: { userId: user.id },
      _sum: { estimatedValue: true },
    }),
  ]);

  const byType = wines.reduce((acc, w) => {
    acc[w.type] = (acc[w.type] ?? 0) + 1;
    return acc;
  }, {});

  const byStatus = wines.reduce((acc, w) => {
    acc[w.status] = (acc[w.status] ?? 0) + 1;
    return acc;
  }, {});

  return {
    totalBottles: totalQuantity._sum.quantity ?? 0,
    totalValue: totalValue._sum.estimatedValue ?? 0,
    totalWines: wines.length,
    byType,
    byStatus,
  };
}

// ─────────────────────────────────────────
// PROFIL
// ─────────────────────────────────────────

export async function getProfile() {
  const user = await getCurrentUser();
  return prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, email: true,
      image: true, role: true, createdAt: true,
      cellarName: true,
      _count: { select: { wines: true } },
    },
  });
}

export async function updateProfile(formData) {
  const user = await getCurrentUser();
  const name  = formData.get('name')?.toString().trim();
  const image = formData.get('image')?.toString().trim() || null;

  if (!name || name.length < 2) {
    return { error: { name: ['Numele trebuie să aibă minim 2 caractere'] } };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name, image, updatedAt: new Date() },
  });

  revalidatePath('/profile');
  revalidatePath('/settings');
}

export async function updatePassword(formData) {
  const user = await getCurrentUser();
  const currentPassword = formData.get('currentPassword')?.toString();
  const newPassword     = formData.get('newPassword')?.toString();
  const confirmPassword = formData.get('confirmPassword')?.toString();

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: 'Completează toate câmpurile' };
  }
  if (newPassword.length < 8) {
    return { error: 'Parola nouă trebuie să aibă minim 8 caractere' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'Parolele nu coincid' };
  }

  try {
    const res = await fetch(`${process.env.BETTER_AUTH_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      return { error: data.message || 'Parola curentă e incorectă' };
    }
  } catch {
    return { error: 'Eroare la schimbarea parolei' };
  }

  return { success: true };
}

export async function deleteAccount() {
  const user = await getCurrentUser();

  await prisma.wine.deleteMany({ where: { userId: user.id } });
  await prisma.session.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });

  redirect('/sign-in');
}

// ─────────────────────────────────────────
// STATISTICI AVANSATE
// ─────────────────────────────────────────

export async function getAdvancedStats() {
  const user = await getCurrentUser();

  const wines = await prisma.wine.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      producer: true,
      country: true,
      type: true,
      rating: true,
      purchasePrice: true,
      estimatedValue: true,
      quantity: true,
      purchaseDate: true,
      vintage: true,
      agingPotential: true,
      drinkFrom: true,
      drinkUntil: true,
      status: true,
      labelImageUrl: true,
      bottleImageUrl: true,
    },
  });

  const topWines = wines
    .filter(w => w.rating != null)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const byCountry = wines.reduce((acc, w) => {
    if (!w.country) return acc;
    acc[w.country] = (acc[w.country] ?? 0) + 1;
    return acc;
  }, {});

  const now = new Date();
  const monthlyData = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('ro-RO', { month: 'short', year: '2-digit' });
    const count = wines.filter(w => {
      if (!w.purchaseDate) return false;
      const pd = new Date(w.purchaseDate);
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
    }).length;
    monthlyData.push({ label, count });
  }

  const withPrice = wines.filter(w => w.purchasePrice != null && w.purchasePrice > 0);
  const prices = withPrice.map(w => w.purchasePrice);
  const avgPrice = prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const mostExpensive = [...withPrice].sort((a, b) => b.purchasePrice - a.purchasePrice)[0] ?? null;

  const currentYear = now.getFullYear();

  // nearMaturity — folosește drinkFrom dacă există, altfel parsează agingPotential
  const nearMaturity = wines
    .filter(w => {
      if (w.status !== 'IN_CELLAR') return false;
      // Folosește drinkUntil dacă există — vinul e relevant dacă nu a trecut de vârf
      if (w.drinkFrom != null || w.drinkUntil != null) {
        const until = w.drinkUntil ?? w.drinkFrom;
        const from  = w.drinkFrom  ?? w.drinkUntil;
        // Arată dacă: e în fereastră SAU urmează în 3 ani
        return until >= currentYear && from <= currentYear + 3;
      }
      if (!w.agingPotential) return false;
      const match = w.agingPotential.match(/(\d{4})/g);
      if (!match) return false;
      const readyYear = Math.min(...match.map(Number));
      return readyYear >= currentYear && readyYear <= currentYear + 3;
    })
    .map(w => {
      let readyYear;
      if (w.drinkFrom != null || w.drinkUntil != null) {
        readyYear = w.drinkFrom ?? w.drinkUntil;
      } else {
        const match = w.agingPotential.match(/(\d{4})/g);
        readyYear = Math.min(...match.map(Number));
      }
      return { ...w, readyYear };
    })
    .sort((a, b) => a.readyYear - b.readyYear)
    .slice(0, 5);

  return {
    topWines,
    byCountry,
    monthlyData,
    priceStats: { avg: avgPrice, max: maxPrice, min: minPrice, mostExpensive },
    nearMaturity,
  };
}

export async function updateCellarName(name) {
  const user = await getCurrentUser();

  const trimmed = name?.toString().trim();
  if (!trimmed || trimmed.length < 1) {
    return { error: 'Numele nu poate fi gol' };
  }
  if (trimmed.length > 50) {
    return { error: 'Maxim 50 de caractere' };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { cellarName: trimmed, updatedAt: new Date() },
  });

  revalidatePath('/', 'layout');
  return { success: true };
}

export async function updateAISettings(provider, apiKey) {
  const user = await getCurrentUser();

  const validProviders = ['gemini', 'claude', 'openai', 'groq'];
  if (!validProviders.includes(provider)) {
    return { error: 'Provider invalid' };
  }

  const data = { aiProvider: provider };
  if (apiKey !== null && apiKey !== undefined) {
    data.aiApiKey = apiKey;
  }

  await prisma.user.update({
    where: { id: user.id },
    data,
  });

  revalidatePath('/settings');
  return { success: true };
}

export async function getAISettings() {
  const user = await getCurrentUser();
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: { aiProvider: true, aiApiKey: true },
  });
  return {
    provider: profile?.aiProvider || 'gemini',
    hasKey: !!profile?.aiApiKey,
  };
}