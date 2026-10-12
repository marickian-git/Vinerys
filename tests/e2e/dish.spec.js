import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('„Ce gătesc azi?” fără AI folosește asocierile salvate și nu inventează vinuri', async ({ page }) => {
  await signUpViaApi(page);
  // Import CSV generic cu asocieri gastronomice: exportul Vinerys are coloana „Asocieri gastronomice”
  const csv = [
    'Nume,Tip,Cantitate,Asocieri gastronomice',
    'Fetească Neagră Test,Roșu,2,Miel la cuptor; Tocană',
    'Sauvignon Test,Alb,1,Pește la grătar; Salată',
  ].join('\n');
  await page.goto(`${BASE}/wines/import`);
  await page.getByLabel('Fișier CSV').setInputFiles({ name: 'vinuri.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
  await page.getByRole('button', { name: 'Importă 2 vinuri' }).click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/wines$`));

  await page.getByRole('link', { name: /Ce gătesc azi\?/ }).click();
  await page.getByLabel('Ce gătești?').fill('miel la cuptor');
  await page.getByRole('button', { name: 'Ce vin deschid?' }).click();
  await expect(page.getByRole('link', { name: 'Fetească Neagră Test' })).toBeVisible();
  await expect(page.getByText('Se potrivește cu „Miel la cuptor”')).toBeVisible();
  await expect(page.getByText('Pe baza asocierilor salvate pe vinuri.')).toBeVisible();

  await page.getByRole('button', { name: 'Somon la grătar' }).click();
  await expect(page.getByRole('link', { name: 'Sauvignon Test' })).toBeVisible();
});
