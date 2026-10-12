import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { BASE, addWine, openWine, signUpViaApi } from './helpers';

// REFACTOR-007: verificare automată WCAG 2.1 A/AA (axe-core) pe ecranele principale
const PAGES = ['/dashboard', '/wines', '/wines/add', '/pairing', '/sommelier', '/planner', '/lists', '/tastings', '/value', '/settings', '/profile', '/wrapped'];

async function violations(page) {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.length}× ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
}

test('paginile publice nu au încălcări WCAG A/AA', async ({ page }) => {
  const report = {};
  for (const path of ['/sign-in', '/sign-up', '/legal/privacy']) {
    await page.goto(`${BASE}${path}`);
    const found = await violations(page);
    if (found.length) report[path] = found;
  }
  expect(report).toEqual({});
});

test('ecranele principale nu au încălcări WCAG A/AA', async ({ page }) => {
  test.setTimeout(150_000);
  await signUpViaApi(page);
  await addWine(page, { name: 'Vin Accesibil', quantity: 2 });
  const report = {};
  for (const path of PAGES) {
    await page.goto(`${BASE}${path}`);
    await page.waitForLoadState('networkidle');
    const found = await violations(page);
    if (found.length) report[path] = found;
  }
  await page.goto(`${BASE}/wines`);
  await openWine(page, 'Vin Accesibil');
  await page.waitForLoadState('networkidle');
  const detail = await violations(page);
  if (detail.length) report['/wines/[id]'] = detail;
  expect(report).toEqual({});
});

test('tastatura: link „Sari la conținut”, meniul contului se deschide și se închide cu Escape', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/dashboard`);
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Sari la conținut' });
  await expect(skip).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#continut')).toBeFocused();

  const account = page.locator('button[aria-controls="vn-account-menu"]');
  await account.focus();
  await page.keyboard.press('Enter');
  await expect(account).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(account).toHaveAttribute('aria-expanded', 'false');
});
