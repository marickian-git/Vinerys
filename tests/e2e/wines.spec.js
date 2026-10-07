import { expect, test } from '@playwright/test';
import { BASE, addWine, signUpViaApi } from './helpers';

test('adăugare vin, consum până la zero, statistici corecte', async ({ page }) => {
  await signUpViaApi(page);
  const name = `Fetească Neagră E2E ${Date.now()}`;
  await addWine(page, { name, quantity: 2, estimatedValue: 50 });

  // Dashboard: 2 sticle × 50 € = 100 €
  await page.goto(`${BASE}/dashboard`);
  await expect(page.locator('.db-kpi', { hasText: 'Sticle în pivniță' }).locator('.db-kpi-value')).toHaveText('2');
  await expect(page.locator('.db-kpi', { hasText: 'Valoare colecție' }).locator('.db-kpi-value')).toHaveText('100€');

  // Consum: primul click cere confirmare, al doilea consumă
  await page.goto(`${BASE}/wines`);
  await page.getByText(name).first().click();
  await expect(page).toHaveURL(/\/crama\/wines\/[^/]+$/);
  const bottles = page.locator('.wd-qs-item', { hasText: 'Sticle' }).locator('.wd-qs-value');
  await expect(bottles).toHaveText('2');
  for (const remaining of ['1', '0']) {
    await page.getByRole('button', { name: /Consumă o sticlă/ }).click();
    await page.getByRole('button', { name: /Confirmi\?/ }).click();
    // Așteptăm actualizarea de pe server (butonul arată ⏳ cât timp acțiunea rulează)
    await expect(bottles).toHaveText(remaining);
  }
  await expect(page.getByRole('button', { name: /Consumă o sticlă/ })).toHaveCount(0);

  await page.goto(`${BASE}/dashboard`);
  await expect(page.locator('.db-kpi', { hasText: 'Sticle în pivniță' }).locator('.db-kpi-value')).toHaveText('0');
});

test('exportul HTML escapează datele introduse de utilizator', async ({ page }) => {
  await signUpViaApi(page);
  const payload = `<img src=x onerror="window.__xss=1">E2E${Date.now()}`;
  await addWine(page, { name: payload });

  const response = await page.request.get(`${BASE}/api/export?format=pdf&filter=all`);
  expect(response.ok()).toBeTruthy();
  const html = await response.text();
  expect(html).toContain('&lt;img src=x onerror=&quot;window.__xss=1&quot;&gt;');
  expect(html).not.toContain('<img src=x');
  expect(response.headers()['content-security-policy']).toContain("default-src 'none'");
});
