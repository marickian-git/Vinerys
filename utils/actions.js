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

  if (filters.type) where.type = filters.type;
  if (filters.status) where.status = filters.status;
  if (filters.country) where.country = filters.country;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { producer: { contains: filters.search, mode: "insensitive" } },
      { region: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return await prisma.wine.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
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

  const grapeVarieties = raw.grapeVarieties
    ? JSON.parse(raw.grapeVarieties)
    : [];
  const foodPairing = raw.foodPairing
    ? JSON.parse(raw.foodPairing)
    : [];

  const parsed = WineSchema.safeParse({ ...raw, grapeVarieties, foodPairing });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.wine.create({
    data: {
      ...parsed.data,
      userId: user.id,
      bottleImageUrl: parsed.data.bottleImageUrl || null,
      labelImageUrl: parsed.data.labelImageUrl || null,
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
  const grapeVarieties = raw.grapeVarieties
    ? JSON.parse(raw.grapeVarieties)
    : [];
  const foodPairing = raw.foodPairing
    ? JSON.parse(raw.foodPairing)
    : [];

  const parsed = WineSchema.safeParse({ ...raw, grapeVarieties, foodPairing });

  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  await prisma.wine.update({
    where: { id },
    data: {
      ...parsed.data,
      bottleImageUrl: parsed.data.bottleImageUrl || null,
      labelImageUrl: parsed.data.labelImageUrl || null,
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

// Adaugă acestea în utils/actions.js (la sfârșitul fișierului)

// ── Profil ──────────────────────────────────────────────────────────────────

export async function getProfile() {
  const user = await getCurrentUser();
  return prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, email: true,
      image: true, role: true, createdAt: true,
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

  // Better Auth — schimbare parolă prin API
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

  // Șterge toate vinurile și pozele asociate
  await prisma.wine.deleteMany({ where: { userId: user.id } });

  // Șterge sesiunile
  await prisma.session.deleteMany({ where: { userId: user.id } });

  // Șterge contul
  await prisma.user.delete({ where: { id: user.id } });

  redirect('/sign-in');
}