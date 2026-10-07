# Vinerys — Roadmap

> Plan viu. Se actualizează după fiecare step: bifează `[x]`, schimbă statusul, notează în `JOURNAL.md`.
> Status: `⬜ neînceput` · `🟨 în lucru` · `✅ gata` · `⏸️ amânat` · `❌ renunțat`

## Viziune

Vinerys devine **pivnița digitală + sommelierul personal**: arată ce sticle trebuie băute curând și cu ce mâncare se potrivesc.
Merge pentru colecția de acasă și poate crește în produs comercial (B2C freemium → crame → restaurante),
multi-limbă și, la final, aplicație mobilă în App Store / Google Play.

## Principii de lucru

1. **Pași mici, verificabili.** Fiecare step se termină cu ceva funcțional și o intrare în `JOURNAL.md`.
2. **Fundația înaintea fațadei.** Bug-uri → arhitectură → design → feature-uri → business → mobile.
3. **Gândit de la început pentru viitor.** Multi-limbă, multi-pivniță (acasă/restaurant/cramă) și API reutilizabil de aplicația mobilă.
4. **Uzul personal e primul client.** Fluxul „Ce bem diseară?” trebuie să fie excelent pentru noi înainte să-l vindem.

---

## Faza 0 — Stabilizare și curățenie  `🟨` (0.1–0.3 gata; rămâne deploy + 0.4)

Obiectiv: aplicația actuală funcționează corect și sigur; avem plasă de siguranță (CI, teste) pentru refactor.
Detalii probleme: vezi `AUDIT.md`.

### 0.1 Bug-uri critice `✅` (testat la rulare 2026-10-07; GitHub #1–#5)
- [x] Consum sticlă: server action cu tranzacție + `WineLog` (înlocuiește ruta Clerk stricată) — B1
- [x] Șterge `app/api/wines/*` (cod Clerk mort) — B2
- [x] Schimbare parolă prin `auth.api.changePassword` cu headers — B3
- [x] Calcul corect „Valoare colecție” (× cantitate, doar `IN_CELLAR`) — B4
- [x] Scriere `WineLog` la create/update/delete/favorite — B5

### 0.2 Securitate `✅` (GitHub #6–#14; trimiterea emailurilor așteaptă contul Brevo)
- [x] Colecție publică opt-in: toggle + regenerare link — B6
- [x] Escaping HTML în export PDF — B7
- [x] MinIO: fără credențiale default, whitelist pentru `folder`, ștergere imagini la delete — B8
- [x] Migrare `aiApiKey` plaintext → `AIAgent` criptat, apoi drop coloană — B9
- [x] Rate limiting (auth, ai-scan, upload) — B10
- [x] Procesare imagini cu sharp (WebP, fără EXIF, thumbnails) — SEC-004, tras din 1.3
- [x] Reset parolă + verificare email prin SMTP generic (Brevo) — B10
- [x] Ștergerea celor 23 imagini orfane (44 MB; copie în `../vinerys-backups/orphan-images-20261007/`)

### 0.3 Calitate și CI `✅` (GitHub #16–#21, #79–#83)
- [x] **DB locală pentru dev** (docker-compose.dev.yml + seed): acum `.env` pointează la DB-ul de producție — B15
- [x] Redenumire pachet, README real, `.env.example`
- [x] ESLint flat config (Prettier amânat)
- [x] Vitest: 58 teste (escape, rateLimit, stocare, media, aiSecrets, SSRF, consensus AI); scorul de urgență vine cu HOME-001
- [x] Playwright: 8 teste e2e pe DB dedicat
- [x] CI: lint + typecheck + unit + migrații + drift + e2e **înainte** de build Docker (tag `staging` amânat: deocamdată poarta de calitate e suficientă)
- [x] `prisma migrate deploy` automat la pornirea containerului
- [x] Health check care verifică și DB-ul (+ `version`)
- [x] Migrație baseline `wine_log` (tabela lipsea din istoricul de migrații)

### 0.4 Observabilitate `⬜`
- [ ] Logging structurat (pino) + Sentry (sau alternativă self-hosted)

---

## Faza 1 — Fundație arhitecturală  `⬜`

Obiectiv: structura care susține design nou, multi-limbă, business și mobile fără rescrieri ulterioare.

### 1.1 Strat de servicii + API `⬜`
- [ ] `server/` cu servicii pe domenii (wines, cellars, ai, media, stats) — logică pură, testabilă
- [ ] Server actions devin wrapper-e subțiri peste servicii
- [ ] API REST `/api/v1/*` peste aceleași servicii (pentru aplicația mobilă), auth prin bearer token
- [ ] Migrare treptată JS → TypeScript (începând cu `server/` și `utils/`)

### 1.2 Model de date nou `⬜`
- [ ] `Cellar` (tip: `HOME` / `VENUE` / `WINERY`) + `CellarMember` (roluri: owner/editor/viewer)
- [ ] Separare `Wine` (eticheta) / `Bottle` (exemplar: preț, locație, dată) / `Tasting` (degustare: notă, rating, mâncare, poze)
- [ ] `Event` log ca sursă de adevăr pentru istoric și statistici
- [ ] Migrare date existente fără pierderi + script de verificare

### 1.3 Pipeline imagini `⬜`
- [ ] `sharp`: resize + WebP + thumbnail la upload
- [ ] Bucket privat + URL-uri semnate (sau proxy prin Next)
- [ ] Curățare imagini orfane

### 1.4 Multi-limbă (i18n) `⬜`
- [ ] `next-intl`, limbi inițiale **RO + EN** (structură pregătită pentru altele)
- [ ] Extragere texte hardcodate în fișiere de mesaje
- [ ] Formatare locală: date, numere, **monedă (RON/EUR/…)** per utilizator
- [ ] Enum-uri traduse (tip, status), AI răspunde în limba utilizatorului
- [ ] Selector limbă în setări + detecție automată

### 1.5 AI găzduit `⬜`
- [ ] Chei de platformă + cote per utilizator (necesar pentru utilizatori obișnuiți / business)
- [ ] BYO keys rămâne opțiune avansată
- [ ] Cache după hash imagine + bază canonică de vinuri (al doilea scan = instant, gratuit)
- [ ] Structured outputs native unde providerul suportă
- [ ] Tracking cost per agent / per utilizator

---

## Faza 2 — Design system și restilizare  `⬜`

Obiectiv: aplicația arată **deosebit** și e ușor de folosit, în special pe telefon.

> **Cerință cheie (utilizator):** designul trebuie să fie *deosebit* și **construit pe baza datelor** pe care le avem.
> Nu facem doar un UI frumos. Fiecare vin, sticlă și pivniță își generează propria identitate vizuală din datele ei.
> Machetele se fac cu date reale din pivniță, nu cu lorem ipsum.

### 2.0 Inventar date → vizual `⬜`
Pentru fiecare câmp din model decidem cum devine vizual:

| Date | Idee vizuală |
|---|---|
| `type` / `color` | Culoarea reală a vinului (rubiniu, pai, somon, chihlimbar) ca accent pe card, nu o culoare generică de categorie |
| Imagine etichetă | Paletă extrasă automat din etichetă → fundalul și gradientul fiecărui card sau pagină de vin |
| `drinkFrom` / `drinkUntil` / `vintage` | Curbă de maturitate (tânăr → vârf → declin) cu marcaj „azi”, plus un inel de urgență pe card |
| `quantity` / `bottleSize` | Siluete de sticle (0.375 → 6L) desenate la scară. Stocul se vede ca un „raft” |
| `aromaProfile` | Roată de arome generată (fructe, flori, condimente, lemn, pământ) cu intensități |
| `country` / `region` | Hartă cu regiunile din colecție și o „amprentă geografică” a pivniței |
| `grapeVarieties` | Constelație sau bule cu soiurile, dimensionate după numărul de sticle |
| `rating` + `Tasting` | Timeline de degustări cu poze de la masă, sub forma unui jurnal vizual |
| `purchasePrice` / `estimatedValue` | Sparkline cu valoarea în timp și un indicator de câștig |
| `cellarLocation` | Harta fizică a pivniței (rafturi), cu sticlele colorate după urgență |
| Pivnița întreagă | „Portretul pivniței”: o compoziție generativă unică per utilizator (tipuri, țări, vârste), folosită și pe pagina publică și în Wrapped |
| Ora / sezonul | Ecranul Acasă se adaptează: seara „Ce bem diseară?”, vara rosé/alb în față, iarna roșii structurate |

### 2.1 Direcție vizuală `⬜`
- [ ] Machete construite pe datele reale din pivniță (vezi 2.0) pentru 2–3 direcții (A „Cramă de noapte”, B „Etichetă editorială”, C „Modern minimal”) pe 5 ecrane: Acasă, Pivniță, Detaliu vin, Sommelier, Scanare
- [ ] Alegere direcție → decizie D1

### 2.2 Design system `⬜`
- [ ] Tokeni (culori, tipografie, spațieri, raze, umbre) în Tailwind v4 / CSS vars
- [ ] Componente de bază (shadcn/ui sau proprii): Button, Card, Input, Sheet, Dialog, Tabs, Badge, Toast…
- [ ] Fonturi prin `next/font` (fără `@import` la runtime)
- [ ] Temă dark + light
- [ ] Accesibilitate: zoom permis, contrast AA, focus vizibil, navigare tastatură

### 2.3 Navigație și layout `⬜`
- [ ] Mobil: tab bar jos — Acasă · Pivniță · [＋ Scanează] · Sommelier · Profil
- [ ] Desktop: sidebar + layout lat

### 2.4 Restilizare ecrane `⬜`
- [ ] Acasă (noul ecran „Ce bem diseară?” + KPI-uri compacte)
- [ ] Pivniță: listă/grilă, filtre în sheet, căutare
- [ ] Detaliu vin: foto-erou, fereastră de consum vizuală, istoric degustări
- [ ] Adăugare camera-first: poză → confirmare (formularul complet doar la nevoie)
- [ ] Setări / Profil / Agenți AI
- [ ] Auth (sign-in/up, forgot/reset password), pagina publică, 404/eroare/offline
- [ ] Șabloane email pe noul design (confirmare email, resetare parolă; RO + EN) — DESIGN-010
- [ ] Spargere fișiere mari: `WineForm` (1222 linii), dashboard (909), `AISettingsSection` (953)

---

## Faza 3 — „Ce bem diseară?” (uz personal)  `⬜`

Obiectiv: în 10 secunde știi ce sticlă să deschizi și cu ce mâncare.

- [ ] 3.1 **Scor de urgență** (trecut de vârf > iese anul ăsta > la vârf > intră curând) + secțiunea „De băut curând”
- [ ] 3.2 **Vin → mâncare**: „Ce gătesc cu el?” — 3 preparate, temperatură servire, decantare
- [ ] 3.3 **Mâncare → vin**: „Ce gătesc azi?” (text / voce / poză) → top 3 sticle din pivniță, scor = potrivire × urgență, cu explicație
- [ ] 3.4 **Deschide sticla** → consum cu un tap → follow-up a doua zi (rating, notă, poză masă)
- [ ] 3.5 **Notificări push**: plan de weekend, vinuri care intră/ies din fereastră
- [ ] 3.6 **Profil de gust** din ratinguri → recomandări personalizate
- [ ] 3.7 **Sommelier conversațional** (chat cu tool-uri peste pivnița reală)

---

## Faza 4 — Colecționar avansat  `⬜`

- [ ] 4.1 Hartă vizuală pivniță (rafturi, drag & drop, „unde e sticla X?”)
- [ ] 4.2 Etichete QR per sticlă → scan = consum / detalii
- [ ] 4.3 Planificator de consum pe ani + curbă de maturitate
- [ ] 4.4 Valoare și ROI, multi-monedă, raport PDF pentru asigurare
- [ ] 4.5 Căutare fuzzy (`pg_trgm`) + filtre salvate
- [ ] 4.6 Import Vivino / CellarTracker (CSV)
- [ ] 4.7 Scanare raft (mai multe sticle) / bon / factură
- [ ] 4.8 „Vinerys Wrapped” — recap anual partajabil
- [ ] 4.9 Pivniță comună familie (folosește `CellarMember` din 1.2)

---

## Faza 5 — Business  `⬜`

Obiectiv: validăm înainte să construim; construim doar ce are cerere confirmată.

### 5.0 Validare și pregătire `⬜`
- [ ] 5 interviuri crame + 5 restaurante/wine baruri + 10 colecționari
- [ ] Nume/brand, domeniu propriu, landing page cu waitlist
- [ ] Hosting de producție (nu doar serverul de acasă): Postgres gestionat, S3/R2, backup, monitorizare → decizie D5
- [ ] Legal: GDPR, Termeni, Politică confidențialitate, cookie consent

### 5.1 B2C Freemium `⬜`
- [ ] Planuri Free / Pro, plăți (Stripe), cote AI, pagină de pricing

### 5.2 „Pașaport digital” pentru crame `⬜`
- [ ] Portal cramă: fișe vinuri oficiale, QR pe sticlă
- [ ] Scan QR → vinul intră în pivniță cu date perfecte
- [ ] Analytics pentru cramă (agregat, anonim)

### 5.3 Restaurante / wine baruri `⬜`
- [ ] Pivniță `VENUE` cu inventar multi-utilizator
- [ ] Listă de vinuri digitală pe QR, generată din stoc
- [ ] Pairing cu meniul, analiză adaos

### 5.4 Venituri adiționale `⬜`
- [ ] Afiliere „Cumpără din nou”
- [ ] Integrare cluburi de vin / cutii lunare
- [ ] Degustări / blind tasting cu vot prin QR

---

## Faza 6 — Aplicație mobilă  `⬜`

- [ ] 6.1 PWA solid: offline-first (IndexedDB + sync), Share Target, push, instalare
- [ ] 6.2 Decizie tehnologie (D3): Expo/React Native (recomandat) vs Capacitor
- [ ] 6.3 App nativă peste `/api/v1` + better-auth (plugin Expo), camera nativă, push nativ
- [ ] 6.4 Publicare App Store + Google Play

---

## ⚠️ Checklist la următorul deploy (push pe `main`)

> **Status 2026-10-07: deploy amânat.** Utilizatorul nu poate face momentan pașii de pe server și scope-ul `workflow`. Lucrul continuă local pe `fix/phase-0-stabilization` (commit-uri, fără push). Lipsa variabilelor MinIO pe server nu strică aplicația: proxy-ul de imagini dă 404 și upload-ul dă eroare, dar restul merge.

**Înainte de merge:**
- [ ] `gh auth refresh -s workflow` (fără acest scope GitHub refuză push-ul cu fișierul de workflow modificat)
- [ ] CI verde pe PR-ul `fix/phase-0-stabilization` → `main`
- [ ] Pe server, în `.env.production`: `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` **chiar setate**. Codul vechi avea fallback-uri (`casa-spiridus.go.ro`, `9010`, `minioadmin`), codul nou nu mai are, deci fără ele upload-ul și imaginile cad
- [ ] Reverse proxy: `proxy_set_header X-Real-IP $remote_addr;` pe locația `/crama`. Altfel toți utilizatorii par să vină de la același IP și împart limita de 5 login-uri/minut
- [ ] Email: copiază din `.env` local în `.env.production` cele 5 variabile `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` (Brevo e configurat și testat, blocarea pe IP e dezactivată)

**Deja făcut pe DB-ul de producție** (compatibil cu codul vechi): migrațiile `share_opt_in` și `wine_log_baseline`, migrarea cheii AI, ștergerea imaginilor orfane. La pornire, `prisma migrate deploy` nu are nimic de aplicat.

**Teste după deploy** (apoi issue-urile trec pe „Done”):
- [ ] `/crama/health` → `db: ok`, `version` = SHA-ul commit-ului
- [ ] Login, dashboard (sticle/valoare), listă, detaliu: imaginile se încarcă prin `/crama/api/media/...` și cardurile primesc variante `?w=480`
- [ ] Upload imagine nouă la editarea unui vin (ajunge WebP)
- [ ] Consumă o sticlă (pe un vin cu stoc > 1, ca să nu se piardă nimic)
- [ ] Setări: activează colecția publică → link deschis în incognito → dezactivează
- [ ] Export CSV + PDF
- [ ] Scanare AI etichetă (agenții existenți funcționează; cheia Gemini merge acum prin header)
- [ ] „Ai uitat parola?” (dacă SMTP e configurat)

**După deploy:**
- [ ] Scoatem policy-ul public de pe bucket-ul MinIO (imaginile se servesc doar prin proxy)
- [ ] Migrația care șterge coloana `user.aiApiKey`
- [ ] Reactivăm colecția publică din Setări, dacă o vrem (linkul vechi revine)

## Corespondență GitHub Project

Proiectul GitHub **Vinerys** (project #5) are acum **117 issues în repo-ul `marickian-git/Vinerys`**, grupate pe milestone-uri M0–M14.
Issue-urile originale erau create greșit în repo-ul `fotbal-genius`. Le-am recreat în Vinerys și le-am închis pe cele vechi, cu link către cele noi.
Convenție: commit-urile menționează ID-ul issue-ului (ex. `fixes #6`). ID-urile se mapează astfel:

| Roadmap | GitHub Project |
|---|---|
| 0.1 | BUG-001…005 |
| 0.2 | SEC-001…009 |
| 0.3 / 0.4 | CI-001…007, REFACTOR-005/006/008, DOC-001 |
| 1.1 | ARCH-006, ARCH-007 |
| 1.2 | DATA-001…007 |
| 2.2 / 2.4 | ARCH-001…005, REFACTOR-001…004, REFACTOR-007 |
| 3.x | AI-001…003, AI-011, CELLAR-006/007 |
| 4.x | CELLAR-*, AI-004…010, SOCIAL-*, RO-*, INT-* |
| 6.x | PWA-001…004 |

Adăugate pe 2026-10-07 (#81–#117): SEC-010/011, BUG-006, ARCH-008, DATA-008/009, AI-012/013, DESIGN-001…009 (M10), I18N-001…004 (M11), HOME-001…006 (M12), BIZ-001…007 (M13), MOB-001…003 (M14).
Mapare suplimentară: 1.4 → M11 · 2.0–2.4 → M10 · 3.x → M12 · 5.x → M13 · 6.2–6.4 → M14.

## Decizii

| ID | Decizie | Status | Rezultat |
|---|---|---|---|
| D1 | Direcție vizuală (A/B/C) | ⬜ deschisă | — |
| D2 | Limbi inițiale | ✅ | RO + EN, structură extensibilă |
| D3 | Tehnologie mobile | ⬜ deschisă | Recomandare: Expo + API v1 |
| D4 | Provider email (reset parolă, notificări) | ⬜ deschisă | Ex: Resend / SMTP propriu |
| D5 | Hosting producție pentru business | ⬜ deschisă | — |
| D6 | Modele business prioritare | 🟨 propus | B2C freemium → Pașaport crame → Restaurante |
| D7 | Ordinea fazelor | ✅ | 0 → 1 → 2 → 3 → 4/5 → 6 (2 și 3 pot avansa în paralel după 1) |
