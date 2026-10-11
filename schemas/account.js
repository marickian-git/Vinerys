// Scheme pentru profil, parolă și setările contului (ARCH-007)
import { z } from 'zod';

export const ProfileInputSchema = z.object({
  name: z.string().trim().min(2, 'Numele trebuie să aibă minim 2 caractere'),
  image: z.string().trim().optional().transform((value) => value || null),
});

export const PasswordChangeSchema = z
  .object({
    currentPassword: z.string({ error: 'Completează toate câmpurile' }).min(1, 'Completează toate câmpurile'),
    newPassword: z.string({ error: 'Completează toate câmpurile' }).min(1, 'Completează toate câmpurile'),
    confirmPassword: z.string({ error: 'Completează toate câmpurile' }).min(1, 'Completează toate câmpurile'),
  })
  .refine((value) => value.newPassword.length >= 8, { message: 'Parola nouă trebuie să aibă minim 8 caractere', path: ['newPassword'] })
  .refine((value) => value.newPassword === value.confirmPassword, { message: 'Parolele nu coincid', path: ['confirmPassword'] });

export const CellarNameSchema = z
  .string({ error: 'Numele nu poate fi gol' })
  .trim()
  .min(1, 'Numele nu poate fi gol')
  .max(50, 'Maxim 50 de caractere');

// Primul mesaj de eroare, pentru acțiunile care întorc { error: string }
export function firstIssueMessage(error) {
  return error.issues[0]?.message ?? 'Date invalide';
}
