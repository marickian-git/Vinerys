import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('scanare cu progres (SSE): fără agent AI, eroarea vine imediat ca JSON, nu ca stream', async ({ page }) => {
  await signUpViaApi(page);
  const response = await page.request.post(`${BASE}/api/ai-scan`, {
    headers: { Accept: 'text/event-stream, application/json' },
    data: { imageBase64: 'x'.repeat(200), mimeType: 'image/jpeg' },
  });
  expect(response.status()).toBe(400);
  expect(response.headers()['content-type']).toContain('application/json');
  expect((await response.json()).error).toContain('agent AI');
});

test('butonul de scanare arată mesajul serverului când nu există agent AI', async ({ page }) => {
  await signUpViaApi(page);
  await page.goto(`${BASE}/wines/add`);
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.getByLabel('Poză cu eticheta').setInputFiles({ name: 'eticheta.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText(/agent AI/).first()).toBeVisible();
});
