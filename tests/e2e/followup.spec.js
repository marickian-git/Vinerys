import { expect, test } from '@playwright/test';
import { addWine, signUpViaApi } from './helpers';

test('„Cum a fost?” apare după consum și dispare după ce notezi degustarea', async ({ page }) => {
  await signUpViaApi(page);
  const name = `FollowUp E2E ${Date.now()}`;
  await addWine(page, { name, quantity: 2 });
  await page.getByText(name).first().click();
  await expect(page.getByText('Ai deschis o sticlă')).toHaveCount(0);

  await page.getByRole('button', { name: /Consumă o sticlă/ }).click();
  await page.getByRole('button', { name: /Confirmi\?/ }).click();
  await expect(page.getByText('Ai deschis o sticlă')).toBeVisible();

  await page.getByRole('button', { name: '5 din 5' }).click();
  await page.getByRole('button', { name: 'Salvează degustarea' }).click();
  await expect(page.getByText('Ai deschis o sticlă')).toHaveCount(0);
  await expect(page.getByLabel('5 din 5', { exact: true }).first()).toBeVisible();
});
