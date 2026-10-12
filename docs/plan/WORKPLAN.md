# Workplan autonom — sesiunea din 2026-10-11

> Branch: `claude/wines-project-rva4jf` (din `main` @ `1e76595`). Push după fiecare issue; fără merge în `main` (= deploy).
> Status: `todo` · `in-progress` · `done` · `skipped` · `blocked`
> Flux per issue: citire issue + comentarii → implementare → teste (`npm test`, plus lint/typecheck) → commit `Closes #N` → push.

## ⚠️ Constatare importantă: munca de design nu e pe GitHub

Issue-urile #22, #91, #103 sunt închise, iar #102/#122 au comentarii care citează commit-urile `f19c454`, `4de769e`, `fa66bfd`, `e825c6a` și `d354b61`.
**Niciunul nu există pe GitHub.** `feat/phase-2-design` are pe remote doar două commit-uri de documentație. Lipsesc deci din repo:
sistemul de teme A–E, `components/ui/`, navigația nouă, `utils/urgency.js`, `utils/wineColor.js`, noul ecran Acasă și sortarea după urgență.

Consecințe pentru planul ăsta:
- **Sar peste issue-urile de design/UI** care ar reface ce există deja local (#122 etc.).
- **Excepție (cerută pe 11.10):** creez 2–3 teme noi ca opțiune de ales (rândul 5b), izolate în fișiere proprii, ușor de mutat peste sistemul de tokeni A–E când acesta ajunge pe GitHub.
- Prefer issue-uri **server-side / fișiere noi**, ca merge-ul cu branch-ul tău local să fie ușor.
- **Acțiune pentru tine:** `git push origin feat/phase-2-design` de pe mașina ta. După aceea, issue-urile de design pot fi reluate.

## Ordinea de lucru

| # | Issue | Titlu | Status | Commit | Note / interpretare |
|---|---|---|---|---|---|
| 1 | #76 | REFACTOR-005 Logging structurat | done | `97b5362` | Logger propriu fără dependențe (merge și în edge) în loc de pino: JSON în producție, secrete redactate, email mascat, `LOG_LEVEL`, latență per agent AI. Costul AI vine în #88 |
| 2 | #75 | REFACTOR-004 Error handling standard | done | `72f0041` | `utils/errors.js`: `AppError` + coduri, `withApiHandler` (requestId, log, 500 generic) pe upload/export/ai-scan; actions aruncă AppError. Corpul JSON păstrează `error`, deci clienții existenți merg; se adaugă `code` + `requestId` |
| 3 | #28 | ARCH-007 Scheme Zod comune | done | `9f72baa` | `schemas/` (wine, account, ai): aceleași scheme pentru actions, `/api/ai-scan` și, pe viitor, formulare client și `/api/v1`. Mesajele de eroare au rămas identice. Response schemas: amânat la ARCH-008 (#84), când există un API public |
| 4 | #120 | DATA-010 Normalizare și vocabulare | done | `133e1b6` | `utils/normalize.js` + normalizare la salvare + `scripts/normalize-wines.mjs` (dry-run/backup/raport). Autocomplete: `datalist` pentru țări/locații (minim, fără restilizare). Culoarea derivată nu ghicește la spumant/desert cu soiuri mixte. **De rulat pe producție:** dry-run, apoi `--apply` |
| 5 | #34 | DATA-006 Statistici prin agregări DB | done | `3503414` | `groupBy`/`aggregate`/SQL în DB în loc de încărcarea tuturor vinurilor. Pentru fereastra de consum se încarcă doar vinurile `IN_CELLAR`. `getCurrentUser` cu `cache()` (o citire a sesiunii pe request). Forma răspunsului e identică |
| — | | **Checkpoint 1** | | | |
| 5b | #125 | DESIGN-012 Teme noi F · G · H (de ales) | done | `3b435d6` | Cerut pe 11.10. Machete: [canvas](https://claude.ai/artifact/1boBd3tvqZ8k9eXU1BLoMv). Tokeni: `docs/design/proposed-themes.tokens.json` + test AA. Integrarea în app așteaptă alegerea ta și sistemul A–E publicat. Issue-ul rămâne deschis |
| 6 | #43 | AI-008 Cache scanări (hash imagine) | done | `258a0dc` | Cache după SHA-256 pe octeții imaginii (tabela `scan_cache`, migrație nouă), doar pentru identificări cu încredere ≥ 0.6, expiră după 180 de zile, `force: true` ocolește cache-ul. Fără hash perceptual (risc de potriviri greșite între ani). Entitățile canonice Wine/Producer rămân la modelul de date (#29–#33, RO-001) |
| 7 | #88 | AI-013 Tracking cost AI | done | `9e70c82` | Tabela `ai_usage` (migrație): o linie per apel de agent (identificare + îmbogățire), cu tokeni, cost, latență și succes. Costul se ia din prețuri configurate (`agent.metadata.pricing` sau `AI_PRICING_JSON`), nu hardcodate. Card „Consum AI” în Setări; adminul vede și totalul platformei |
| 8 | #111 | BIZ-004 GDPR: export date + pagini legale | done | `1cbf7f4` | Export JSON complet (`/api/account/export`, fără secrete, rate limit). Paginile `/legal/privacy` și `/legal/terms` sunt schițe RO cu [PLACEHOLDER] pentru operator, contact și găzduire: **cer revizuire juridică**. Cookie consent: nu e necesar, avem doar cookie-uri strict necesare (scris în politică). Ștergerea contului exista deja |
| 9 | #64 | INT-001 Import CSV Vivino | done | `c542d27` | Pagina `/wines/import`: upload, auto-detectare format, mapare coloane editabilă, preview cu Nou/Duplicat/Eroare, import în tranzacție + `wine_log` ADDED. Motor comun `utils/csvImport.js` (și pentru #65 și CSV generic, inclusiv exportul Vinerys). Rating 1–5 rotunjit; zecimalele Vivino se pierd |
| 10 | #65 | INT-002 Import CSV CellarTracker | done | `be5fa76` | Preset CellarTracker (detectat după `iWine`) peste motorul din #64: tipuri compuse („White - Sweet/Dessert”), mărime în ml, BeginConsume/EndConsume, Valuation, Location, scor pe 100 → 1–5, NV (1001) → fără an |
| — | | **Checkpoint 2** | | | |
| 11 | #123 | CI-008 Smoke test producție | done | `e210058` | `scripts/smoke-prod.mjs` + `npm run smoke:prod`: 10 pași, cont de test creat și șters în `finally`, așteaptă `version` din `/health`, webhook la eșec. Verificat local 10/10 (fără MinIO). Fără job programat în GitHub Actions: modificarea workflow-urilor cere scope-ul `workflow`; se rulează manual după deploy |
| 12 | #104 | HOME-003 Vin → mâncare | done | `083e709` | Secțiunea „Ce gătesc cu el?” pe pagina vinului: 3 preparate + temperatură + decantare + pahar, generate cu agenții utilizatorului (fallback pe rând), cache pe vin (`pairing`/`pairingKey`, migrație), invalidat când se schimbă identitatea vinului. Consumul AI intră în `ai_usage` |
| 13 | #55 | CELLAR-009 Căutare fuzzy (pg_trgm) | done | `0ff37bb`, `154d5ba` | pg_trgm (`word_similarity` pe nume/producător, fără diacritice cu `translate`) + căutare în regiune/soiuri/arome/asocieri/note + limbaj natural (tip, „gata de băut”, „trecute de vârf”, sub/peste preț, an, favorite). Filtre salvate (max 20). 2 migrații. Moneda în „lei/€” e ignorată; prețul se compară cu valoarea salvată (multi-currency = #35) |
| 14 | #57 | SOCIAL-001 Vinerys Wrapped | done | `609e4c5` | Pagina `/wrapped?year=` ca o poveste verticală de carduri: sticle, țări, soiul anului, ritmul pe luni, producătorul preferat, cea mai scumpă sticlă, preferatele, pivnița azi. Distribuire prin Web Share / clipboard. Istoricul vechi vine din `consumptionDate`. Fără imagine generată și fără pagină publică (vin cu designul nou, #94) |
| 15 | #77 | REFACTOR-006 Sentry (opțional, pe DSN) | done | `a7f92d0` | Fără SDK: client minimal compatibil Sentry/GlitchTip (`utils/errorReporting.js`), activ doar cu `SENTRY_DSN`. Server: `instrumentation.js` → `onRequestError`. Browser: `app/error.jsx` → `/api/client-errors`. Release = `APP_VERSION`, mediul = `SENTRY_ENVIRONMENT`. Verificat cap-coadă cu un endpoint fals. Fără source maps (cer SDK + upload la build) |

## Lot 2 — 2026-10-12 (după merge-ul PR #124)

Același flux. Branch-ul a fost repornit din `main` (`137957e`). Un singur merge la final, ca deploy-urile să rămână rare.

| # | Issue | Titlu | Status | Commit | Note / interpretare |
|---|---|---|---|---|---|
| 16 | #66 | INT-003 „Cumpără din nou” | done | `b6ec4b3` | Card pe pagina vinului când s-a terminat un vin cu rating ≥ 4 sau favorit (issue-ul cere ≥ 5; prea rar pe scara 1–5): linkuri de căutare Vivino / Google Shopping + „L-am cumpărat din nou” (readuce vinul în pivniță cu sticle noi, `wine_log` ADDED restock). Afilierea rămâne pentru BIZ |
| 17 | #31 | DATA-003 Modelul Tasting | done | `4500563` | Model `Tasting` (migrație + valoarea `TASTED` în `LogAction`): vin, dată, rating, ocazie, oameni, mâncare, loc, note, poze, arome. Aditiv, fără să atingă `Wine`; primește `bottleId` când vine #30. `Wine.rating` = media degustărilor. CRUD în actions + `schemas/tasting.js`; export GDPR include degustările și filtrele salvate |
| 18 | #49 | CELLAR-003 Jurnal de degustare | done | `174c5e3` | Secțiunea „Jurnal de degustare” pe pagina vinului (formular cu stele, ocazie, oameni, mâncare, loc, arome, note, poză) + pagina `/tastings` cu toate degustările și ratingul mediu. Link din Profil. O singură poză per degustare în UI (modelul acceptă 6) |
| 19 | #106 | HOME-005 „Deschide sticla” + follow-up | done | `2abf4e1` | „Cum a fost?”: imediat după consum, pe pagina vinului se deschide formularul de degustare. În Pivniță apare un banner pentru sticlele deschise acum 12 h – 7 zile fără degustare („Notează” / „Nu acum”, ținut minte în browser). Consumul cu un tap din recomandarea de pe Acasă rămâne la branch-ul de design (ecranul Acasă e acolo) |
| 20 | #61 | SOCIAL-005 Badge-uri | done | `efd008a` | 8 badge-uri cu 4 niveluri (Bronz → Platină) calculate din date, fără tabel nou: țări, soiuri, degustări, sticle consumate, pivniță, regiuni românești, deschise în fereastră, scanări AI. Card pe Profil, cu „Următoarea provocare”. „Toate DOC-urile din România” așteaptă baza DOC (RO-002, #63); până atunci se numără regiunile |
| — | | **Checkpoint 4** | | | |
| 21 | #52 | CELLAR-006 Planificator de consum | done | `030ff5e` | Pagina `/planner`: sticlele din pivniță împărțite uniform pe anii ferestrei (orizont de 10 ani), cu cele depășite în anul curent marcate și cele aflate în ultimul an. Vinurile fără fereastră sunt listate separat, cu link de editare. Fallback pe anii din `agingPotential`. Planul e calculat, nu salvat; „assign bottles to years” manual vine cu modelul Bottle (#30) |
| 22 | #48 | CELLAR-002 QR per sticlă | done | `f2ed602` | QR per vin (o etichetă pentru fiecare sticlă, până la 48) pe `/wines/[id]/labels` (printabil, SVG inline), cu link „Etichete QR” pe pagina vinului. Scanarea deschide `/q/[id]`: „Deschid o sticlă” consumă dintr-un singur tap, apoi „Notează cum a fost”. QR-ul unic per sticlă vine cu modelul Bottle (#30). Dependență nouă: `qrcode` |
| 23 | #87 | AI-012 Chei de platformă + cote | done | `244f2db` | `PLATFORM_AI_AGENTS` (JSON în env) pentru cei fără chei proprii; cote lunare per utilizator (`AI_QUOTA_SCANS` = 20, `AI_QUOTA_TEXT` = 50, admin nelimitat), numărate din `ai_usage.source = platform` (migrație). Cheile proprii au prioritate și nu consumă cotă. Peste cotă: mesaj clar + 429. Cota apare în cardul „Consum AI”. Planurile Free/Pro vin cu BIZ-005 (#112) |
| 24 | #84 | ARCH-008 API REST /api/v1 | done | `1a7d535`, `8ba4b7e` | Bearer token (plugin better-auth `bearer`), `/api/v1` peste serviciile din `server/` (refactor `1a7d535`, parte din #27): me, wines (listă/căutare, CRUD, PATCH parțial), consume, tastings, pairing, stats + `openapi.json` public. Rate limit 120/min. Fără `bottles` (vine cu #30). `/api/ai-scan` merge deja cu bearer |
| 25 | #35 | DATA-007 Multi-currency | done | `dfa0a21` | `Wine.currency` (moneda originală a prețurilor) + `User.currency` (moneda statisticilor), cu migrație și EUR implicit pentru datele existente. Cursuri BCE zilnice cu cache (12 h; 30 min după eșec; fallback `FX_RATES_JSON`). Statisticile, Wrapped și profilul sunt convertite; prețurile apar cu `Intl` (narrowSymbol: €, lei, $). Select de monedă în formular și în Setări; exportul are coloana Monedă. Filtrul de preț compară în moneda vinului. Formatarea completă per limbă vine cu #100 |
| — | | **Checkpoint 5** + merge | | | |

## Lot 3 — 2026-10-12 (după PR #126)

| # | Issue | Titlu | Status | Commit | Note / interpretare |
|---|---|---|---|---|---|
| 26 | #46 | AI-011 Profil de gust | done | `326dd53` | Profil explicabil, fără ML: fiecare vin votează pentru trăsăturile lui (tip, soiuri, țară, regiune, categorii de arome), ponderat cu cât ți-a plăcut (rating, degustări, favorit, sticle consumate). Pe Profil: preferințe + ce să eviți + „Din pivniță, pe gustul tău” cu % și motive. Pe pagina vinului: „Asemănătoare din pivniță” |
| 27 | #105 | HOME-004 Mâncare → vin | done | `638bcb3` | Pagina `/pairing` „Ce gătesc azi?” (text + exemple): top 3 sticle din pivniță, scor = potrivire × urgență × gust (#46), cu explicație. Cu AI: agenții proprii sau ai platformei, validat ca să nu inventeze vinuri. Fără AI: asocierile salvate pe vin (`foodPairing`, completat la 100% la scanare). Vocea (AI-007) și poza (AI-003) rămân în issue-urile lor. Importul CSV citește acum și asocierile |
| 28 | #37 | AI-002 Tool-uri AI peste colecție | done | `6a926a0` | `server/sommelierTools.js`: searchWines (limbaj natural + filtre), getWine, getAvailableBottles (după urgență), getUserPreferences (profilul #46). Argumente validate cu Zod, executate doar pe datele utilizatorului, rezultate compacte. Protocol JSON independent de provider (Gemini, Claude și OpenAI-compatibil au formate diferite de tool calling). Verificat pe DB local, inclusiv izolarea între utilizatori |
| 29 | #36 | AI-001 Sommelier conversațional | done | `6ddee97` | Chat `/sommelier` + `POST /api/v1/sommelier`. Bucla agent (`server/sommelier.js`): maximum 4 apeluri de tool (#37), apoi răspuns. Recomandă doar vinuri apărute în rezultatele tool-urilor (id-urile inventate sunt eliminate), respectă prețul și tipul cerut, explică. Verificat cap-coadă cu un LLM fals local + DB real. Istoricul conversației stă în browser (fără tabel). Fix: modelele fără imagini nu mai sunt respinse la cererile doar text |
| 30 | #54 | CELLAR-008 Istoric de preț și ROI | done | `12c1b79` | Tabela `wine_valuation` (migrație cu backfill: valoarea curentă devine primul punct). Se scrie la creare, la import și la schimbarea valorii sau monedei. Pe pagina vinului: sparkline + ROI. Pagina `/value`: valoare, cost, câștig, ROI, top câștiguri/pierderi, în moneda utilizatorului. `/value/report`: raport printabil/PDF pentru asigurare. Fără prețuri de piață automate (nu există o sursă publică) |
| — | | **Checkpoint 6** | | | |
| 31 | #59 | SOCIAL-003 Wishlist și liste publice | todo | | |
| 32 | #53 | CELLAR-007 Notificări push | todo | | |

## Sărite (cu motiv)

| Issue | Motiv |
|---|---|
| #89, #92–#97, #118, #121, #122 (label `design`) | Depind de sistemul de teme/componente care există doar local (vezi mai sus). Temele sunt deja decise (D1) |
| #23, #24, #25, #26 | Componente comune, `next/font`, tokeni: făcute local în `feat/phase-2-design`, nepublicate |
| #102 HOME-001 | Restul (fallback `agingPotential`, ponderare cu valoarea) modifică `utils/urgency.js`, care nu e pe GitHub |
| #72, #73, #74 | Split pe fișierele UI mari. Dashboard-ul a fost refăcut local, deci conflict sigur |
| #27 ARCH-006, #15 CI-001 | Refactor mare pe `utils/actions.js` + migrare TS. De făcut după ce branch-ul local e publicat |
| #29–#33, #85, #60 | Modelul nou de date (Bottle/Tasting/Event/Cellar) e o decizie de arhitectură care cere aprobare |
| #108–#110, #112–#117, #71 | Business, mobile, research: nu sunt taskuri de cod sau cer decizii/conturi externe |
| #36–#42, #44–#46, #105–#107 | Feature-uri AI/UX mari; după ce UI-ul nou e publicat |
| #47–#54, #56, #58, #59, #61–#63, #66–#70, #78, #84, #87, #98–#101 | Rămân pe roadmap; nu încap în bugetul sesiunii sau depind de cele de mai sus |

## Checkpoint-uri

### Checkpoint 1 — 2026-10-11

- **Terminate (5):** #76 logging structurat, #75 erori standard, #28 scheme Zod, #120 normalizare, #34 statistici în DB. În plus, un bug găsit pe drum: `fix(consume)` (`d3fd874`, după un consum reușit butonul rămânea pe „Confirmi?”).
- **Teste:** 105 unit (erau 58), e2e 8/8 local (Postgres 16 + Chromium din container), lint 0 erori (1 warning existent în `ImageUpload`), typecheck curat.
- **Probleme:**
  - Munca de design de pe mașina utilizatorului nu e pe GitHub (vezi sus).
  - Testul e2e de consum pica și pe `main`; reparat.
- **Rămase:** rândurile 5b–15.
- **Merge:** PR #124 rămâne deschis și strânge toate issue-urile sesiunii. Utilizatorul a cerut pe 11.10 deploy-uri rare, deci un singur merge la final, după CI verde. Pe producție nu e nicio migrație. `scripts/normalize-wines.mjs` se rulează manual (dry-run, apoi `--apply`).

### Checkpoint 2 — 2026-10-12

- **Terminate (6):**
  - #125 teme F/G/H (propuse; issue-ul rămâne deschis pentru alegere)
  - #43 cache scanări
  - #88 cost AI
  - #111 GDPR + pagini legale
  - #64 import Vivino
  - #65 import CellarTracker
- **Teste:** 152 unit, e2e 12/12 local (noi: GDPR, import), CI verde pe fiecare push din PR #124.
- **Migrații noi:** `scan_cache` și `ai_usage`. Se aplică automat la pornirea containerului (`prisma migrate deploy`).
- **Probleme / capcane:**
  - Prisma 7 nu mai rulează `generate` după `migrate dev`.
  - Limita de sign-up bloca e2e-ul; acum se configurează prin `AUTH_SIGNUP_MAX`, doar în teste.
  - Canvas-ul cu temele A–E nu poate fi citit din sesiune.
- **De făcut de tine:**
  - Alege temele din [canvas](https://claude.ai/artifact/1boBd3tvqZ8k9eXU1BLoMv).
  - Completează `[PLACEHOLDER]`-ele din paginile legale.
  - Opțional: setează `AI_PRICING_JSON`.
- **Rămase:** rândurile 11–15.

### Checkpoint 3 — 2026-10-12 (planul inițial terminat)

- **Terminate (5):**
  - #123 smoke test producție
  - #104 „Ce gătesc cu el?”
  - #55 căutare fuzzy + limbaj natural + filtre salvate
  - #57 Wrapped
  - #77 raportare erori
- **În plus:**
  - `dde8373`: timeout e2e mai mare la adăugarea vinului (flaky pe server rece).
  - `154d5ba`: migrația `pg_trgm` nu mai poate bloca pornirea containerului. Testată și pe o bază fără drept de CREATE.
- **Teste:** 175 unit, e2e 14/14, drift = 0, CI verde pe PR #124.
- **Total sesiune:** 16 issue-uri închise prin PR #124, plus #125 (teme) deschis pentru alegere.
- **Migrații noi (se aplică automat la pornire):** `scan_cache`, `ai_usage`, `wine_pairing`, `wine_search_trgm`, `saved_filters`.
- **După deploy:**
  - `npm run smoke:prod`
  - `node scripts/normalize-wines.mjs` (dry-run, apoi `--apply`)
  - opțional `SENTRY_DSN` / `AI_PRICING_JSON`
- **Rămân pentru sesiunile următoare:**
  - după publicarea `feat/phase-2-design`: design (#122, #125, #89–#97), #102;
  - modelul de date nou (#29–#33, #85), care cere aprobare;
  - #27 strat de servicii, #84 API v1, #87 cote AI;
  - push (#53), i18n (#98–#101).

### Checkpoint 4 — 2026-10-12

- **Terminate (5):** #66 „Cumpără din nou”, #31 modelul Tasting, #49 jurnal de degustare, #106 „Cum a fost?”, #61 badge-uri.
- **Bug găsit de e2e:** `de51761` (`z.coerce.boolean("false") === true`). Orice vin salvat din formular devenea favorit. **De verificat în producție:** câte vinuri sunt favorite fără să fi fost alese.
- **Teste:** 193 unit, e2e 18/18 (rulat de două ori; o rulare lentă a avut eșecuri de timing, trecute la rerulare).
- **Migrație nouă:** `tasting` (+ `LogAction.TASTED`).
- **Rămase în lotul 2:** #52, #48, #87, #84, #35.

### Checkpoint 5 — 2026-10-12 (lotul 2 terminat)

- **Terminate (5):** #52 plan de consum, #48 QR per sticlă, #87 AI găzduit + cote, #84 API v1 (+ stratul de servicii, parte din #27), #35 multi-currency.
- **Lotul 2 complet:** 10 issue-uri închise + fix `isFavorite` + 2 îmbunătățiri e2e (helper `openWine`, timeout).
- **Teste:** 213 unit, e2e 24/24, drift = 0.
- **Migrații noi în lotul 2:** `tasting`, `ai_usage_source`, `currency`.
- **Dependență nouă:** `qrcode`.
- **Env nou (opțional):** `PLATFORM_AI_AGENTS`, `AI_QUOTA_SCANS`, `AI_QUOTA_TEXT`, `FX_RATES_JSON`.
- **Merge:** un singur PR pentru tot lotul 2 (deploy rar).

### Checkpoint 6 — 2026-10-12

- **Terminate (5):** #46 profil de gust, #105 „Ce gătesc azi?”, #37 tool-uri AI, #36 Sommelier conversațional, #54 valoare și ROI.
- **Lotul 2** e în `main` (PR #126, `7e6e08c`).
- **Teste:** 233 unit, e2e 28/28. Sommelierul e verificat cap-coadă cu un LLM fals local, pe DB-ul real.
- **Bug reparat:** modelele fără suport de imagini erau respinse și la cererile doar text.
- **Migrație nouă:** `wine_valuation`, cu backfill.
- **Rămase în lotul 3:** #59, #53.

