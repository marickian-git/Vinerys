import { describe, expect, it } from 'vitest';
import { parseWineForm, wineInputFromFormData } from '@/schemas/wine';
import { CellarNameSchema, PasswordChangeSchema, ProfileInputSchema, firstIssueMessage } from '@/schemas/account';
import { AIAgentInputSchema, ScanRequestSchema } from '@/schemas/ai';

function form(values) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.append(key, value);
  return data;
}

describe('parseWineForm', () => {
  it('parsează listele JSON, anii și golește URL-urile goale', () => {
    const { data, error } = parseWineForm(form({
      name: 'Fetească Neagră', type: 'RED', quantity: '6', vintage: '2021',
      grapeVarieties: '["Fetească Neagră"]', aromaProfile: '', drinkFrom: '2024', drinkUntil: '',
      labelImageUrl: '',
    }));
    expect(error).toBeUndefined();
    expect(data).toMatchObject({
      name: 'Fetească Neagră', type: 'RED', quantity: 6, vintage: 2021,
      grapeVarieties: ['Fetească Neagră'], aromaProfile: [], foodPairing: [],
      drinkFrom: 2024, drinkUntil: null, labelImageUrl: null, status: 'IN_CELLAR',
    });
  });

  it('isFavorite: „false” din formular rămâne false', () => {
    expect(parseWineForm(form({ name: 'X', type: 'RED', isFavorite: 'false' })).data.isFavorite).toBe(false);
    expect(parseWineForm(form({ name: 'X', type: 'RED', isFavorite: 'true' })).data.isFavorite).toBe(true);
    expect(parseWineForm(form({ name: 'X', type: 'RED' })).data.isFavorite).toBe(false);
  });

  it('întoarce erorile pe câmpuri', () => {
    const { error } = parseWineForm(form({ name: '', type: 'BLUE' }));
    expect(error.name).toEqual(['Numele este obligatoriu']);
    expect(error.type).toBeDefined();
  });

  it('tolerează JSON invalid în liste', () => {
    expect(wineInputFromFormData({ grapeVarieties: '{oops' }).grapeVarieties).toEqual([]);
  });
});

describe('scheme cont', () => {
  it('profil: nume minim 2 caractere, imagine goală = null', () => {
    expect(ProfileInputSchema.parse({ name: ' Ana ', image: '' })).toEqual({ name: 'Ana', image: null });
    expect(ProfileInputSchema.safeParse({ name: 'A' }).success).toBe(false);
  });

  it('parolă: aceleași mesaje ca înainte', () => {
    const message = (input) => firstIssueMessage(PasswordChangeSchema.safeParse(input).error);
    expect(message({ currentPassword: 'x' })).toBe('Completează toate câmpurile');
    expect(message({ currentPassword: 'x', newPassword: 'short', confirmPassword: 'short' })).toBe('Parola nouă trebuie să aibă minim 8 caractere');
    expect(message({ currentPassword: 'x', newPassword: 'longenough', confirmPassword: 'different1' })).toBe('Parolele nu coincid');
  });

  it('numele pivniței', () => {
    expect(CellarNameSchema.parse('  Crama Spiridus ')).toBe('Crama Spiridus');
    expect(firstIssueMessage(CellarNameSchema.safeParse('   ').error)).toBe('Numele nu poate fi gol');
    expect(firstIssueMessage(CellarNameSchema.safeParse('x'.repeat(51)).error)).toBe('Maxim 50 de caractere');
  });
});

describe('AIAgentInputSchema', () => {
  const base = { name: 'Gemini', provider: 'gemini', model: 'gemini-2.5-flash', id: null, baseUrl: null };

  it('limitează valorile numerice ca vechiul cod', () => {
    const parsed = AIAgentInputSchema.parse({ ...base, priority: -3, timeoutMs: 999999, maxRetries: 0, weight: 50 });
    expect(parsed).toMatchObject({ priority: 0, timeoutMs: 60000, maxRetries: 1, weight: 10 });
    expect(AIAgentInputSchema.parse({ ...base, timeoutMs: 'abc' }).timeoutMs).toBe(20000);
  });

  it('cere nume și model', () => {
    expect(firstIssueMessage(AIAgentInputSchema.safeParse({ ...base, name: '' }).error)).toMatch(/Numele agentului/);
    expect(firstIssueMessage(AIAgentInputSchema.safeParse({ ...base, model: ' ' }).error)).toMatch(/Model ID/);
  });
});

describe('ScanRequestSchema', () => {
  it('validează imaginea și tipul MIME', () => {
    expect(ScanRequestSchema.parse({ imageBase64: 'abc' }).mimeType).toBe('image/jpeg');
    expect(ScanRequestSchema.safeParse({ imageBase64: 'abc', mimeType: 'text/html' }).success).toBe(false);
    expect(ScanRequestSchema.safeParse({}).success).toBe(false);
  });
});
