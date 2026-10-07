import { expect } from '@playwright/test';

export const BASE = '/crama';
export const PASSWORD = 'E2e-Password-123';

export function uniqueEmail(prefix = 'e2e') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@vinerys.test`;
}

// Cont nou prin API: cookie-ul de sesiune ajunge în contextul browserului
export async function signUpViaApi(page, { name = 'E2E User', email = uniqueEmail() } = {}) {
  const response = await page.request.post(`${BASE}/api/auth/sign-up/email`, {
    data: { name, email, password: PASSWORD },
    headers: { Origin: new URL(page.context()._options.baseURL || 'http://localhost:3200').origin },
  });
  expect(response.ok()).toBeTruthy();
  return { name, email };
}

export async function addWine(page, { name, quantity = 1, estimatedValue } = {}) {
  await page.goto(`${BASE}/wines/add`);
  await page.getByPlaceholder('ex. Château Margaux').fill(name);
  await page.getByRole('button', { name: /Detalii/ }).first().click();
  await page.getByPlaceholder('1', { exact: true }).fill(String(quantity));
  if (estimatedValue !== undefined) {
    await page.getByRole('button', { name: /Stocare|Preț/ }).first().click();
    await page.getByPlaceholder('ex. 80.00').fill(String(estimatedValue));
  }
  await page.getByRole('button', { name: /Degustare|Rating/ }).first().click();
  await page.getByRole('button', { name: /Adaugă/ }).last().click();
  await expect(page).toHaveURL(new RegExp(`${BASE}/wines$`));
  await expect(page.getByText(name).first()).toBeVisible();
}
