import { expect, test } from '@playwright/test';
import { BASE, PASSWORD, signUpViaApi, uniqueEmail } from './helpers';

test('rutele protejate redirecționează spre autentificare', async ({ page }) => {
  await page.goto(`${BASE}/wines`);
  await expect(page).toHaveURL(/\/crama\/sign-in/);
});

test('înregistrare din formular → dashboard', async ({ page }) => {
  await page.goto(`${BASE}/sign-up`);
  await page.getByPlaceholder('Ion Popescu').fill('Ana Test');
  await page.getByPlaceholder('email@exemplu.ro').fill(uniqueEmail('signup'));
  await page.getByPlaceholder('Minim 8 caractere').fill(PASSWORD);
  await page.getByPlaceholder('••••••••').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/crama\/dashboard/, { timeout: 15_000 });
});

test('autentificare: parolă greșită respinsă, parolă corectă acceptată', async ({ page, browser }) => {
  const { email } = await signUpViaApi(page);
  const context = await browser.newContext();
  const fresh = await context.newPage();
  await fresh.goto(`${BASE}/sign-in`);
  await fresh.getByPlaceholder('email@exemplu.ro').fill(email);
  await fresh.getByPlaceholder('••••••••').fill('gresita-123');
  await fresh.locator('button[type="submit"]').click();
  await expect(fresh).toHaveURL(/\/crama\/sign-in/);

  await fresh.getByPlaceholder('••••••••').fill(PASSWORD);
  await fresh.locator('button[type="submit"]').click();
  await expect(fresh).toHaveURL(/\/crama\/dashboard/, { timeout: 15_000 });
  await context.close();
});

test('„Ai uitat parola?” trimite cererea fără să dezvăluie dacă există contul', async ({ page }) => {
  await page.goto(`${BASE}/sign-in`);
  await page.getByRole('link', { name: 'Ai uitat parola?' }).click();
  await expect(page).toHaveURL(/\/crama\/forgot-password/);
  await page.getByPlaceholder('email@exemplu.ro').fill('nimeni@vinerys.test');
  await page.getByRole('button', { name: 'Trimite linkul' }).click();
  await expect(page.getByText('Dacă există un cont pentru')).toBeVisible();
});

test('link de resetare invalid afișează eroare', async ({ page }) => {
  await page.goto(`${BASE}/reset-password`);
  await expect(page.getByText('Linkul de resetare este invalid sau a expirat.')).toBeVisible();
});
