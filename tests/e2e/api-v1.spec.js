import { expect, test } from '@playwright/test';
import { BASE, PASSWORD, uniqueEmail } from './helpers';

test('API v1 cu bearer token: CRUD vin, consum, degustare, statistici', async ({ playwright, baseURL }) => {
  const anon = await playwright.request.newContext({ baseURL });
  const email = uniqueEmail('api');
  const signUp = await anon.post(`${BASE}/api/auth/sign-up/email`, { data: { name: 'API User', email, password: PASSWORD }, headers: { Origin: baseURL } });
  expect(signUp.ok()).toBeTruthy();
  const token = signUp.headers()['set-auth-token'];
  expect(token).toBeTruthy();

  // Context nou, fără cookie-uri: doar Authorization
  const api = await playwright.request.newContext({ baseURL, extraHTTPHeaders: { Authorization: `Bearer ${token}` } });
  expect((await (await api.get(`${BASE}/api/v1/me`)).json()).user.email).toBe(email);

  const created = await api.post(`${BASE}/api/v1/wines`, { data: { name: 'Fetească Neagră API', type: 'RED', quantity: 3, country: 'romania', vintage: 2020 } });
  expect(created.status()).toBe(201);
  const { wine } = await created.json();
  expect(wine).toMatchObject({ name: 'Fetească Neagră API', country: 'România', quantity: 3, color: 'RED' });

  const patched = await api.patch(`${BASE}/api/v1/wines/${wine.id}`, { data: { cellarLocation: 'Lada' } });
  expect((await patched.json()).wine).toMatchObject({ cellarLocation: 'Lada', quantity: 3, name: 'Fetească Neagră API' });

  const list = await (await api.get(`${BASE}/api/v1/wines?search=feteasca`)).json();
  expect(list.wines.map((w) => w.id)).toContain(wine.id);

  expect((await (await api.post(`${BASE}/api/v1/wines/${wine.id}/consume`, { data: { quantity: 2 } })).json()).remaining).toBe(1);
  const tooMany = await api.post(`${BASE}/api/v1/wines/${wine.id}/consume`, { data: { quantity: 5 } });
  expect(tooMany.status()).toBe(400);
  expect((await tooMany.json()).code).toBe('VALIDATION');

  const tasting = await api.post(`${BASE}/api/v1/wines/${wine.id}/tastings`, { data: { rating: 5, notes: 'Din aplicația mobilă' } });
  expect(tasting.status()).toBe(201);
  expect((await (await api.get(`${BASE}/api/v1/wines/${wine.id}`)).json()).wine.rating).toBe(5);

  // Fără agenți AI și fără chei de platformă: eroare clară, nu 500
  const pairing = await api.get(`${BASE}/api/v1/wines/${wine.id}/pairing`);
  expect(pairing.status()).toBe(400);
  expect((await pairing.json()).error).toContain('Setări');

  expect(await (await api.get(`${BASE}/api/v1/stats`)).json()).toMatchObject({ totalBottles: 1, totalWines: 1 });
  expect((await api.delete(`${BASE}/api/v1/wines/${wine.id}`)).status()).toBe(204);
  expect((await api.get(`${BASE}/api/v1/wines/${wine.id}`)).status()).toBe(404);
});

test('API v1 fără token → 401; OpenAPI public', async ({ request }) => {
  const response = await request.get(`${BASE}/api/v1/wines`);
  expect(response.status()).toBe(401);
  expect((await response.json()).code).toBe('UNAUTHENTICATED');
  const spec = await (await request.get(`${BASE}/api/v1/openapi.json`)).json();
  expect(spec.openapi).toBe('3.1.0');
  expect(Object.keys(spec.paths)).toContain('/wines/{id}/consume');
});
