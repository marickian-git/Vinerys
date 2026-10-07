import { expect, test } from '@playwright/test';
import { BASE, addWine, signUpViaApi } from './helpers';

test('colecția e privată implicit; partajarea se activează, se regenerează și se dezactivează', async ({ page, browser }) => {
  await signUpViaApi(page);
  const name = `Share E2E ${Date.now()}`;
  await addWine(page, { name });

  await page.goto(`${BASE}/settings`);
  const toggle = page.getByRole('switch', { name: 'Colecție publică' });
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await expect(page.getByText('Colecția este privată')).toBeVisible();

  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'true');
  const linkInput = page.locator('.share-input');
  await expect(linkInput).toBeVisible();
  const firstUrl = await linkInput.inputValue();

  const visitor = await browser.newContext();
  const visitorPage = await visitor.newPage();
  await visitorPage.goto(firstUrl);
  await expect(visitorPage.getByText(name).first()).toBeVisible();

  // Regenerare: linkul vechi nu mai funcționează
  await page.getByRole('button', { name: /Generează link nou/ }).click();
  await page.getByRole('button', { name: /Sigur\?/ }).click();
  await expect(linkInput).not.toHaveValue(firstUrl);
  const secondUrl = await linkInput.inputValue();
  await visitorPage.goto(firstUrl);
  await expect(visitorPage.getByText('Această colecție nu există')).toBeVisible();
  await visitorPage.goto(secondUrl);
  await expect(visitorPage.getByText(name).first()).toBeVisible();

  // Dezactivare
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-checked', 'false');
  await visitorPage.goto(secondUrl);
  await expect(visitorPage.getByText('Această colecție nu există')).toBeVisible();
  await visitor.close();
});
