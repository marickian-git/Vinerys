# Vinerys — Pivnița digitală

Aplicație pentru gestionarea unei colecții de vinuri: inventar, fereastră de consum, scanarea etichetelor cu un ensemble de agenți AI, statistici și partajarea colecției.

**Stack:** Next.js 16 (App Router, server actions) · React 19 · PostgreSQL + Prisma 7 · better-auth · MinIO (S3) · sharp · Vitest · Playwright.

Planul de dezvoltare, deciziile și jurnalul sunt în [`docs/plan/`](docs/plan/ROADMAP.md).

## Pornire rapidă (dev)

```bash
npm install
cp .env.example .env.local        # completează secretele
npm run db:dev                    # Postgres 17 local (docker-compose.dev.yml, port 5433)
npx prisma migrate deploy
npm run dev                       # http://localhost:3000/crama
```

> Nu folosi baza de date de producție pentru dezvoltare sau teste.

## Scripturi

| Comandă | Ce face |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Teste unitare (Vitest, `tests/unit`) |
| `npm run test:e2e` | Teste end-to-end (Playwright, `tests/e2e`). Pornește singur build + server pe portul 3200 și refuză să ruleze pe DB-ul de producție |
| `npm run images:orphans` | Raport imagini MinIO nefolosite (`-- --delete` pentru ștergere, doar mai vechi de 24h) |
| `npm run studio` | Prisma Studio |

## Configurare

Toate variabilele sunt documentate în [`.env.example`](.env.example). Câteva reguli:

- **`BASE_URL`** se aplică la build. Aplicația rulează sub `/crama`, deci orice link sau `fetch` absolut trece prin `appPath()` (`utils/appPath.js`).
- **`AI_CREDENTIALS_SECRET`** criptează cheile API ale agenților (AES-256-GCM). Nu se schimbă fără o migrare a credențialelor.
- **MinIO:** nu există credențiale implicite. Imaginile se servesc prin `/api/media/...`, cu verificarea accesului (proprietar sau colecție publică), deci bucket-ul poate fi privat.
- **Email:** SMTP generic (recomandat Brevo, gratuit). Fără SMTP, resetarea parolei și verificarea emailului nu trimit nimic în producție.

## AI ensemble

Din **Setări → AI** se adaugă agenți (Gemini, Groq, OpenRouter, Claude, OpenAI, Mistral, DeepSeek, Z.ai, Cerebras, Together, Fireworks sau orice endpoint OpenAI-compatible). Cheile sunt criptate pe server și nu ajung niciodată în client. Agenții activi rulează în paralel. Rezultatele sunt normalizate și votate ponderat per câmp, iar scanarea doar precompletează formularul. Endpointurile custom sunt validate împotriva SSRF: doar HTTPS, fără IP-uri private sau locale și fără endpointuri de metadata.

## Securitate (rezumat)

- Rate limiting pe login, înregistrare, parolă, scanare AI și upload
- Upload-uri procesate cu sharp: tipul real al fișierului e verificat, EXIF/GPS eliminat, conversie la WebP
- Export HTML/CSV cu escaping și protecție la formula injection
- Colecția publică e opt-in, cu link pe care îl poți regenera

## Deploy

Push pe `main` → GitHub Actions rulează lint, typecheck, teste unitare, migrații pe o bază curată și e2e. Doar dacă trec toate se construiește imaginea Docker (amd64 + arm64), care e publicată pe Docker Hub și preluată de Watchtower pe server.

Containerul rulează `prisma migrate deploy` la pornire, iar healthcheck-ul (`/crama/health`) verifică și baza de date.

### Backup și restaurare (server)

```bash
/opt/vinerys/scripts/backup.sh              # backup manual
ls -lh /opt/vinerys/backups/postgres/       # backup-uri existente
/opt/vinerys/scripts/restore.sh             # restaurează cel mai recent
/opt/vinerys/scripts/restore.sh 2026-03-06  # restaurează o dată anume
```

Fără `pg_dump` local: `docker run --rm postgres:17-alpine pg_dump -Fc "$DATABASE_URL" > backup.dump`.
