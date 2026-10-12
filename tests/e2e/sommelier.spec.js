import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('Sommelier fără agenți AI: mesaj clar, conversația rămâne utilizabilă', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/sommelier`);
  await page.getByRole('button', { name: 'Ce vinuri trebuie să beau curând?' }).click();
  const log = page.getByRole('log', { name: 'Conversația cu Sommelierul' });
  await expect(log.getByText('Ce vinuri trebuie să beau curând?')).toBeVisible();
  await expect(log.getByText(/Configurează cel puțin un agent AI/)).toBeVisible();
  await expect(page.getByLabel('Întrebarea ta')).toBeEnabled();
});
