import { expect, test } from '@playwright/test';
import { BASE, signUpViaApi } from './helpers';

test('notificări: fără VAPID sunt dezactivate elegant; cron-ul cere secretul', async ({ page, request }) => {
  await signUpViaApi(page);
  const config = await (await page.request.get(`${BASE}/api/push/subscribe`)).json();
  expect(config).toEqual({ enabled: false, publicKey: null });

  await page.goto(`${BASE}/settings`);
  await expect(page.getByText(/Notificările nu sunt încă activate pe server|nu suportă notificări/)).toBeVisible();

  expect((await request.post(`${BASE}/api/cron/digest`)).status()).toBe(401);
  expect((await request.post(`${BASE}/api/cron/digest`, { headers: { Authorization: 'Bearer gresit-gresit-gre' } })).status()).toBe(401);
  const ok = await request.post(`${BASE}/api/cron/digest`, { headers: { Authorization: 'Bearer e2e-cron-secret' } });
  expect(ok.status()).toBe(200);
  expect(await ok.json()).toMatchObject({ sent: 0 });
  const weekend = await request.post(`${BASE}/api/cron/digest?kind=weekend`, { headers: { Authorization: 'Bearer e2e-cron-secret' } });
  expect(await weekend.json()).toMatchObject({ sent: 0 });
});
