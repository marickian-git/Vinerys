import { expect, test } from '@playwright/test';
import { BASE, addWine, signUpViaApi } from './helpers';

test('exportul GDPR conține datele utilizatorului, fără secrete', async ({ page }) => {
  const { email } = await signUpViaApi(page);
  const name = `Export E2E ${Date.now()}`;
  await addWine(page, { name, quantity: 3 });

  const response = await page.request.get(`${BASE}/api/account/export`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-disposition']).toContain('attachment');
  const body = await response.json();
  expect(body.user.email).toBe(email);
  expect(body.wines.map((w) => w.name)).toContain(name);
  expect(body.wineLogs.some((log) => log.action === 'ADDED')).toBe(true);
  const raw = JSON.stringify(body);
  expect(raw).not.toContain('encryptedApiKey');
  expect(raw).not.toMatch(/"password"|"token"/);
});

test('exportul cere autentificare', async ({ request }) => {
  const response = await request.get(`${BASE}/api/account/export`);
  expect(response.status()).toBe(401);
});

test('paginile legale sunt publice', async ({ page }) => {
  await page.goto(`${BASE}/legal/privacy`);
  await expect(page.getByRole('heading', { name: 'Politica de confidențialitate' })).toBeVisible();
  await page.goto(`${BASE}/legal/terms`);
  await expect(page.getByRole('heading', { name: 'Termeni și condiții' })).toBeVisible();
});
