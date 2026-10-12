import { expect, test } from '@playwright/test';
import { BASE, addWine, openWine, signUpViaApi } from './helpers';

test('jurnal de degustare: adăugare, rating propagat pe vin, pagina /tastings, ștergere', async ({ page }) => {
  await signUpViaApi(page);
  const name = `Tasting E2E ${Date.now()}`;
  await addWine(page, { name, quantity: 2 });
  await openWine(page, name);

  await page.getByRole('button', { name: '+ Adaugă degustare' }).click();
  await page.getByRole('button', { name: '4 din 5' }).click();
  await page.getByLabel('Ocazie').fill('Cină de duminică');
  await page.getByLabel('Cu cine').fill('Ana, Mihai');
  await page.getByLabel('Mâncare').fill('Miel la cuptor');
  await page.getByLabel('Arome').fill('mure, vanilla');
  await page.getByLabel('Note').fill('Fructe negre, final lung');
  await page.getByRole('button', { name: 'Salvează degustarea' }).click();

  await expect(page.getByText('Fructe negre, final lung')).toBeVisible();
  await expect(page.getByText(/Cină de duminică · cu Ana, Mihai/)).toBeVisible();
  await expect(page.getByText('mure · vanilie')).toBeVisible(); // aromele trec prin vocabularul canonic

  await page.goto(`${BASE}/tastings`);
  await expect(page.getByText('1 degustare · rating mediu 4.0')).toBeVisible();
  await expect(page.getByRole('link', { name })).toBeVisible();

  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Șterge degustarea' }).click();
  await expect(page.getByText('Încă nicio degustare')).toBeVisible();
});
