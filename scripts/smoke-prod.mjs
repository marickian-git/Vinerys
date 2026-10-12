// CI-008: test de fum în producție după deploy, cu un cont de test dedicat (creat și șters la fiecare rulare).
//
//   SMOKE_URL=https://casa-spiridus.go.ro/crama npm run smoke:prod
//
// Opțiuni (env):
//   SMOKE_URL               URL-ul aplicației, cu basePath (obligatoriu)
//   SMOKE_EXPECT_VERSION    așteaptă până când /health raportează acest commit (Watchtower a preluat imaginea)
//   SMOKE_WAIT_SECONDS      cât așteaptă versiunea (implicit 900)
//   SMOKE_SKIP_UPLOAD=1     sare peste pasul cu poza (ex. local, fără MinIO)
//   SMOKE_WEBHOOK_URL       primește un POST JSON cu raportul când un pas pică
//   SMOKE_CHROMIUM          calea către Chromium, dacă Playwright nu are browserul lui
//   SMOKE_HEADED=1          rulează cu browser vizibil
// Ieșire: cod 0 = OK, 1 = cel puțin un pas a picat. Contul de test se șterge în `finally`.
import { chromium } from '@playwright/test';
import sharp from 'sharp';

const APP_URL = (process.env.SMOKE_URL || '').replace(/\/$/, '');
if (!APP_URL) {
  console.error('Setează SMOKE_URL (ex. https://exemplu.ro/crama)');
  process.exit(2);
}
const ORIGIN = new URL(APP_URL).origin;
const EMAIL = `smoke+${Date.now()}@vinerys.test`;
const PASSWORD = `Smoke-${Math.random().toString(36).slice(2, 10)}-A1`;
const NEW_PASSWORD = `${PASSWORD}-nou`;
const WINE = `Smoke Test ${new Date().toISOString().slice(0, 16)}`;

const results = [];
async function step(name, fn) {
  const startedAt = Date.now();
  try {
    await fn();
    results.push({ name, ok: true, ms: Date.now() - startedAt });
    console.log(`  ✓ ${name} (${Date.now() - startedAt} ms)`);
  } catch (error) {
    results.push({ name, ok: false, ms: Date.now() - startedAt, error: error.message.split('\n')[0] });
    console.log(`  ✗ ${name}: ${error.message.split('\n')[0]}`);
    throw error;
  }
}
function assert(condition, message) {
  if (!condition) throw new Error(message);
}
const euro = (text) => Number.parseFloat(text.replace(/[^\d,.-]/g, '').replace(',', '.'));

async function waitForVersion() {
  const expected = process.env.SMOKE_EXPECT_VERSION;
  const deadline = Date.now() + Number(process.env.SMOKE_WAIT_SECONDS || 900) * 1000;
  for (;;) {
    const health = await fetch(`${APP_URL}/health`).then((r) => r.json()).catch(() => null);
    if (health?.db === 'ok' && (!expected || health.version?.startsWith(expected))) return health;
    if (Date.now() > deadline) throw new Error(`health: ${JSON.stringify(health)} (aștept versiunea ${expected ?? 'oricare'})`);
    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }
}

const browser = await chromium.launch({ headless: !process.env.SMOKE_HEADED, executablePath: process.env.SMOKE_CHROMIUM || undefined });
const context = await browser.newContext({ locale: 'ro-RO' });
const page = await context.newPage();
page.setDefaultTimeout(20_000);
let accountCreated = false;
let accountDeleted = false;
let imageUrl = null;

console.log(`Smoke ${APP_URL} · cont ${EMAIL}`);
try {
  await step('health + versiune', async () => {
    const health = await waitForVersion();
    console.log(`    version=${health.version ?? '?'}`);
  });

  await step('înregistrare cont de test', async () => {
    const response = await page.request.post(`${APP_URL}/api/auth/sign-up/email`, {
      data: { name: 'Smoke Test', email: EMAIL, password: PASSWORD },
      headers: { Origin: ORIGIN },
    });
    assert(response.ok(), `sign-up ${response.status()}`);
    accountCreated = true;
  });

  await step(`vin nou (2 sticle × 50 €${process.env.SMOKE_SKIP_UPLOAD ? ', fără poză' : ', cu poză'})`, async () => {
    await page.goto(`${APP_URL}/wines/add`);
    await page.getByPlaceholder('ex. Château Margaux').fill(WINE);
    if (!process.env.SMOKE_SKIP_UPLOAD) {
      const png = await sharp({ create: { width: 400, height: 600, channels: 3, background: '#7a1e3a' } }).png().toBuffer();
      const uploaded = page.waitForResponse((r) => r.url().includes('/api/upload') && r.request().method() === 'POST');
      await page.locator('input[type=file]').first().setInputFiles({ name: 'smoke.png', mimeType: 'image/png', buffer: png });
      const response = await uploaded;
      const body = await response.json();
      assert(response.ok() && body.type === 'image/webp', `upload ${response.status()} ${JSON.stringify(body).slice(0, 120)}`);
      imageUrl = body.url;
    }
    await page.getByRole('button', { name: /Detalii/ }).first().click();
    await page.getByPlaceholder('1', { exact: true }).fill('2');
    await page.getByRole('button', { name: /Stocare|Preț/ }).first().click();
    await page.getByPlaceholder('ex. 80.00').fill('50');
    await page.getByRole('button', { name: /Degustare|Rating/ }).first().click();
    await page.getByRole('button', { name: /Adaugă/ }).last().click();
    await page.waitForURL(/\/wines$/);
  });

  const kpi = (label) => page.locator('.db-kpi', { hasText: label }).locator('.db-kpi-value');
  await step('dashboard: 2 sticle / 100 €', async () => {
    await page.goto(`${APP_URL}/dashboard`);
    assert((await kpi('Sticle în pivniță').innerText()).trim() === '2', 'sticle ≠ 2');
    assert(euro(await kpi('Valoare colecție').innerText()) === 100, 'valoare ≠ 100');
  });

  await step('pagina vinului (+ poza)', async () => {
    await page.goto(`${APP_URL}/wines`);
    await page.getByText(WINE).first().click();
    await page.waitForURL(/\/wines\/[^/]+$/);
    if (imageUrl) {
      const loaded = await page.locator('img[src*="/api/media/"]').first().evaluate((img) => img.complete && img.naturalWidth > 0);
      assert(loaded, 'poza nu se încarcă');
    }
  });

  await step('consum o sticlă → 1 sticlă, 50 €', async () => {
    await page.getByRole('button', { name: /Consumă o sticlă/ }).click();
    await page.getByRole('button', { name: /Confirmi\?/ }).click();
    await page.locator('.wd-qs-item', { hasText: 'Sticle' }).locator('.wd-qs-value').filter({ hasText: /^1$/ }).waitFor();
    await page.goto(`${APP_URL}/dashboard`);
    assert(euro(await kpi('Valoare colecție').innerText()) === 50, 'valoare ≠ 50');
  });

  await step('link public: privat → activ → dezactivat', async () => {
    await page.goto(`${APP_URL}/settings`);
    const toggle = page.getByRole('switch', { name: 'Colecție publică' });
    assert((await toggle.getAttribute('aria-checked')) === 'false', 'colecția nu e privată implicit');
    await toggle.click();
    const link = page.locator('.share-input');
    await link.waitFor();
    const url = await link.inputValue();
    const visitor = await browser.newContext();
    const visitorPage = await visitor.newPage();
    await visitorPage.goto(url);
    await visitorPage.getByText(WINE).first().waitFor();
    await toggle.click();
    await page.waitForFunction(() => document.querySelector('[role=switch]')?.getAttribute('aria-checked') === 'false');
    await visitorPage.goto(url);
    await visitorPage.getByText('Această colecție nu există').waitFor();
    await visitor.close();
  });

  await step('schimbare parolă', async () => {
    const fields = page.locator('input[type=password]');
    await fields.nth(0).fill(PASSWORD);
    await fields.nth(1).fill(NEW_PASSWORD);
    await fields.nth(2).fill(NEW_PASSWORD);
    await page.getByRole('button', { name: /Schimbă parola/ }).click();
    await page.getByText('Parolă schimbată cu succes!').first().waitFor();
  });

  await step('ștergere vin (+ poza din stocare)', async () => {
    await page.goto(`${APP_URL}/wines`);
    await page.getByText(WINE).first().click();
    await page.waitForURL(/\/wines\/[^/]+$/);
    await page.getByRole('button', { name: /Șterge/ }).first().click();
    await page.getByRole('button', { name: /⚠️ Confirmi\?/ }).click();
    await page.waitForURL(/\/wines$/);
    assert((await page.getByText(WINE).count()) === 0, 'vinul apare încă în listă');
    if (imageUrl) {
      const media = await page.request.get(imageUrl);
      assert(media.status() === 404, `poza răspunde încă (${media.status()})`);
    }
  });
} catch {
  // pasul care a picat e deja în raport; curățenia rulează mai jos
} finally {
  if (accountCreated) {
    try {
      await step('ștergere cont de test', async () => {
        await page.goto(`${APP_URL}/settings`);
        await page.getByRole('button', { name: /Șterge contul permanent/ }).click();
        await page.getByPlaceholder('ȘTERGE CONTUL').fill('ȘTERGE CONTUL');
        await page.getByRole('button', { name: 'Confirmă ștergerea' }).click();
        await page.waitForURL(/sign-in/);
        const login = await page.request.post(`${APP_URL}/api/auth/sign-in/email`, {
          data: { email: EMAIL, password: NEW_PASSWORD }, headers: { Origin: ORIGIN },
        });
        const loginOld = await page.request.post(`${APP_URL}/api/auth/sign-in/email`, {
          data: { email: EMAIL, password: PASSWORD }, headers: { Origin: ORIGIN },
        });
        assert(!login.ok() && !loginOld.ok(), 'contul încă se poate autentifica');
        accountDeleted = true;
      });
    } catch {
      console.log(`  ! Șterge manual contul ${EMAIL}`);
    }
  }
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
const report = { url: APP_URL, ok: failed.length === 0, accountDeleted, account: EMAIL, at: new Date().toISOString(), results };
console.log(`\n${report.ok ? 'OK' : 'FAIL'}: ${results.length - failed.length}/${results.length} pași`);
if (!report.ok && process.env.SMOKE_WEBHOOK_URL) {
  await fetch(process.env.SMOKE_WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report) }).catch(() => {});
}
process.exit(report.ok ? 0 : 1);
