import { expect, test } from '@playwright/test';
import { BASE, addWine, openWine, signUpViaApi } from './helpers';

test('moneda preferată: vinurile noi o folosesc implicit, iar statisticile se afișează în ea', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/settings`);
  await page.getByLabel('Moneda statisticilor').selectOption('RON');
  await expect(page.getByText('Statisticile se afișează în RON')).toBeVisible();

  const name = `Lei E2E ${Date.now()}`;
  await addWine(page, { name, quantity: 2, estimatedValue: 75 });
  await openWine(page, name);
  await expect(page.getByText(/^75\slei$/)).toBeVisible();

  await page.goto(`${BASE}/dashboard`);
  await expect(page.locator('.db-kpi', { hasText: 'Valoare colecție' }).locator('.db-kpi-value')).toHaveText(/^150\slei$/);

  const csv = await (await page.request.get(`${BASE}/api/export?format=csv`)).text();
  expect(csv.split('\n')[0]).toContain('Monedă');
  expect(csv).toContain('RON');
});
