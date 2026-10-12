import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('listă de cadouri publică: vizitatorul rezervă, proprietarul vede doar „rezervat”', async ({ page, browser }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/lists`);
  await page.getByLabel('Numele listei').fill('De Crăciun');
  await page.getByLabel('Tip').selectOption('GIFTS');
  await page.getByRole('button', { name: 'Creează lista' }).click();
  await expect(page.getByRole('button', { name: /De Crăciun/ })).toBeVisible();

  await page.getByLabel('Vin', { exact: true }).fill('Barolo Monfortino');
  await page.getByLabel('Producător').fill('Giacomo Conterno');
  await page.getByRole('button', { name: 'Adaugă', exact: true }).click();
  // Fie apare elementul, fie o eroare (raportată explicit, ca să fie vizibilă în CI)
  const added = page.getByText(/Barolo Monfortino · Giacomo Conterno/);
  await expect(added.or(page.locator('form [role=alert]'))).toBeVisible({ timeout: 15_000 });
  const alertText = await page.locator('form [role=alert]').allTextContents();
  expect(alertText, 'eroare la adăugare').toEqual([]);
  await expect(added).toBeVisible();

  await page.getByRole('button', { name: 'Privată' }).click();
  await expect(page.getByRole('button', { name: 'Publică' })).toBeVisible();
  const shareUrl = await page.getByLabel('Link public pentru De Crăciun').inputValue();
  expect(shareUrl).toMatch(/\/crama\/l\/[\w-]+$/);

  const visitor = await browser.newContext();
  const guest = await visitor.newPage();
  await guest.goto(shareUrl);
  await expect(guest.getByRole('heading', { name: 'De Crăciun' })).toBeVisible();
  await guest.getByRole('button', { name: 'Îl dăruiesc eu' }).click();
  await guest.getByLabel('Numele tău').fill('Mătușa Ana');
  await guest.getByRole('button', { name: 'Rezervă' }).click();
  await expect(guest.getByRole('status')).toHaveText('L-ai rezervat. Mulțumim!');

  await guest.reload();
  await expect(guest.getByText('Rezervat 🎁')).toBeVisible();
  await expect(guest.getByText('Mătușa Ana')).toHaveCount(0);
  await visitor.close();

  await page.reload();
  await expect(page.getByText('rezervat 🎁')).toBeVisible();
  await expect(page.getByText('Mătușa Ana')).toHaveCount(0);
});
