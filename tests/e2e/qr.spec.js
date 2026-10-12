import { expect, test } from '@playwright/test';
import { BASE, addWine, openWine, signUpViaApi } from './helpers';

test('etichete QR per sticlă și consum cu un tap după scanare', async ({ page }) => {
  await signUpViaApi(page);
  const name = `QR E2E ${Date.now()}`;
  await addWine(page, { name, quantity: 2 });
  await openWine(page, name);
  const wineId = page.url().split('/').pop();

  await page.getByRole('link', { name: /Etichete QR/ }).click();
  await expect(page.getByRole('img', { name: `Cod QR pentru ${name}` })).toHaveCount(2);
  await expect(page.locator('.qr svg').first()).toBeVisible();

  // Ce ar deschide telefonul după scanare
  await page.goto(`${BASE}/q/${wineId}`);
  await expect(page.getByRole('heading', { name })).toBeVisible();
  await page.getByRole('button', { name: 'Deschid o sticlă' }).click();
  await expect(page.getByRole('status')).toContainText('Mai ai 1 sticlă');
  await expect(page.getByRole('link', { name: 'Notează cum a fost' })).toBeVisible();
});

test('QR-ul unui vin străin nu e accesibil', async ({ page }) => {
  await signUpViaApi(page);
  // Cu loading.jsx, Next trimite pagina în flux și statusul rămâne 200; conținutul e pagina 404
  await page.goto(`${BASE}/q/nu-exista-123`);
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Această pagină a fost');
  await expect(page.getByRole('button', { name: 'Deschid o sticlă' })).toHaveCount(0);
});
