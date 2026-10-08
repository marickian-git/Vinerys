# Jurnal de lucru

> După fiecare step se adaugă o intrare **deasupra** celor vechi (cea mai nouă prima).
> Șablon:
>
> ```
> ## AAAA-LL-ZZ — <Faza.Step> <titlu>
> **Făcut:** ce s-a schimbat (fișiere/commit-uri)
> **Decizii:** ce am ales și de ce
> **Învățat / capcane:** lucruri utile pentru pașii următori
> **Rămas / next:** ce urmează, ce s-a amânat
> ```

---

## 2026-10-08 — Verificare GitHub: migrarea din fotbal-genius, statusuri

**Făcut:**
- Am verificat migrarea issue-urilor Vinerys create inițial în `fotbal-genius` (#45–#130, mutate pe 07.10).
  - Toate au comentariul „Mutat în …”, sunt închise acolo și au ieșit din proiectul FotbalGenius.
  - 6 n-au fost mutate intenționat: 4 descrieri de milestone, devenite M0–M14, și 2 duplicate.
  - Vinerys are 120 de issue-uri, toate în proiectul #5 și cu milestone. În fotbal-genius nu a rămas nimic de-al Vinerys.
- Proiect: #86 DATA-009 → Done (era deja închis), #90 DESIGN-002 → In Progress.
- Push pe `feat/phase-2-design` (branch non-main, fără deploy).

**Rămas / next:** alegerea direcției vizuale (D1). Apoi confirmarea deploy-ului pe Pi, iar cele 25 de issue-uri din Faza 0 trec pe Done și se închid.

---

## 2026-10-07 — Merge Faza 0 + machete de design (DESIGN-002)

**Făcut:**
- **Merge PR #119** în `main` (`1e76595`), după erori interne GitHub (push/merge reîncercate automat, au trecut la a 4-a încercare). Primul run de pe `main` a fost anulat în timpul instalării Chromium (probabil instabilitatea GitHub de atunci). L-am repornit: **verde**, iar imaginea e publicată pe Docker Hub. La ~16:02 Pi-ul rula încă imaginea veche: `/crama/health` fără `db`/`version`, deci Watchtower nu o preluase.
- **Machete:** [canvas privat](https://claude.ai/artifact/CAJw4MLMmbdk24wmFDwWJQ) cu 3 direcții × 3 ecrane, toate pe datele reale din Crama Spiridus:
  - **A · Cramă de noapte:** dark bordo/auriu, Cormorant + Manrope. Sugestia serii cu curba de maturitate, „De băut curând” cu inele de urgență, zone cu sticle colorate, roată de arome.
  - **B · Etichetă editorială:** hârtie, Instrument Serif + Plex Mono. Titlu de „ziar” pentru sugestia serii, calendarul de consum (sticle pe anul de final al ferestrei: 14 până la finalul lui 2027), lista vinurilor ca o carte de vinuri, detaliu ca o etichetă.
  - **C · Modern minimal:** Geist, culoarea vine doar din vinuri. „Portretul pivniței” (29 de bare colorate, înălțimea = timpul rămas), treemap al zonelor (suprafața = sticle), fereastra ca celule pe ani, arome ca bare.
- GitHub: #120 DATA-010 (normalizare), #121 AI-014 (decupare automată sticlă/etichetă), comentarii pe #86 și #90.
- Branch nou de lucru: `feat/phase-2-design` (din `main`).

**Decizii:**
- Machetele **nu folosesc fotografiile reale**: sunt scene din casă (TV, interior, curte). Sticlele sunt desenate, colorate după tip și vârstă.
- Sommelier și Scanare se desenează după ce se alege direcția (D1).

**Învățat / capcane:**
- Pozele de etichetă sunt fotografii întregi, deci paleta extrasă e a fundalului. Ideea „culoare din etichetă” depinde de decupare (AI-014). Același lucru contează și pentru confidențialitatea paginii publice.
- În zsh, un `$3` necitat nu se desparte în mai multe argumente (`--label data` devine un singur flag). Flag-urile se scriu explicit.

**Rămas / next:**
- Utilizatorul alege direcția (sau o combinație) → D1.
- Update pe Pi (Watchtower / manual în CasaOS) → teste după deploy → issue-uri pe „Done”.

 + merge blocat de GitHub

**Făcut:**
- `docs/plan/DATA-REPORT.md`: interogări read-only pe datele reale.
  - Datele sunt bogate datorită scanării AI: fereastră de consum 97%, poză etichetă 97%, arome 86%.
  - Lipsesc: rating (25%), culoare (14%), favorite (11%).
  - 22 din 24 de vinuri din pivniță sunt „la vârf acum”, mediana anilor e 2023.
  - Locațiile sunt zone ale casei (Lada, Frigider, Bucătărie), nu rafturi.
  - Duplicate din diacritice/spații („România”/„Romania”, „Frigider ”).
- Merge-ul PR-ului #119 a pornit cu variabilele setate de utilizator în CasaOS (fără `X-Real-IP`, amânat). GitHub a răspuns însă cu Internal Server Error la push, la merge (GraphQL și REST) și la crearea de issue-uri. githubstatus.com arăta „All Systems Operational”. Reîncercare automată în fundal.

**Decizii (pentru design):**
- Scorul de urgență trebuie să ordoneze *în interiorul* ferestrei (timp rămas până la `drinkUntil`, cantitate), nu doar „în / în afara ferestrei”.
- Harta pivniței pornește de la zone ale casei, nu de la o grilă de rafturi.
- Paleta din etichetă și curba de maturitate sunt viabile ca elemente vizuale principale.
- Rating-urile se colectează activ după degustare.
- Notele AI se separă vizual de notele personale.

**Rămas / next:**
- Merge + deploy + teste după deploy, când GitHub acceptă din nou scrieri.
- Issue-ul DATA-010 (normalizare) pe GitHub, plus comentariul pe DATA-009 (#86).
- DESIGN-002: machete pe datele reale.



**Făcut:** am acordat scope-ul `workflow`, am făcut push pe `fix/phase-0-stabilization` și am deschis PR-ul [#119](https://github.com/marickian-git/Vinerys/pull/119). Primul run CI (37640810282) e verde pe toți pașii: lint, typecheck, unit, migrații pe DB curat, drift, e2e. Build-ul Docker a fost sărit pe PR, cum e corect.

**Învățat / capcane:**
- `gh auth refresh` trebuie finalizat în browser (device code), pe contul `marickian-git`. Pe mașină e logat și `MarianSpiridon`, așa că trebuie verificat cu `gh auth status`.
- Push-ul pe branch-uri non-main declanșează doar job-ul `quality`, nu deploy-ul.

**Rămas:** merge-ul (= deploy) așteaptă variabilele din `.env.production` și headerul `X-Real-IP` pe server.



**Decizie:** utilizatorul nu poate face acum `gh auth refresh -s workflow`, variabilele din `.env.production` și headerul `X-Real-IP` din nginx. Deploy-ul se amână, iar lucrul continuă local, cu commit-uri pe același branch.

**Verificat:** codul nou se degradează controlat dacă lipsesc variabilele MinIO. Proxy-ul media prinde eroarea (404), upload-ul răspunde cu eroare, ștergerile de imagini sunt best-effort, deci paginile nu cad. Fără `X-Real-IP`, better-auth folosește `x-forwarded-for`. Fără SMTP, emailurile nu pleacă, dar nimic nu se strică.



**Făcut:** `.env` local cu `SMTP_HOST/PORT/USER/PASS` (Brevo) și `EMAIL_FROM="Vinerys <marickian21@gmail.com>"`. Autentificarea SMTP merge. Test real prin aplicație: sign-up pe `marickian21+vinerys-test@gmail.com` a trimis emailul de confirmare, iar cererea de resetare pe aceeași adresă emailul de resetare. Contul de test a fost șters.

**Învățat / capcane:**
- Conturile Brevo noi au „Authorised IPs” activ: `525 5.7.1 Unauthorized IP address`. Am dezactivat blocarea, fiindcă serverul de pe `go.ro` are probabil IP dinamic.
- Cheia corectă e cea SMTP (`xsmtpsib-…`), nu cheia API (`xkeysib-…`). Login-ul SMTP e `…@smtp-brevo.com`, nu emailul contului.
- Expeditor `@gmail.com`: nu se poate autentifica (DKIM/DMARC). Brevo poate rescrie „From”, iar emailurile pot ajunge în Spam. Se rezolvă cu domeniu propriu (BIZ-002).
- Aceleași 5 variabile trebuie puse și în `.env.production` pe server.



**Făcut:**
- **Imagini orfane:** am descărcat local cele 23 (`../vinerys-backups/orphan-images-20261007/`), apoi le-am șters. Bucket-ul are 67 de obiecte, toate referite.
- **Email** `1b15cfe`:
  - SMTP generic (`utils/email.js`, nodemailer) + șabloane HTML în română.
  - better-auth: resetare parolă (1h, folosire unică, revocă sesiunile) și verificare email la sign-up.
  - Pagini `/forgot-password` și `/reset-password`, link „Ai uitat parola?”, banner de verificare în Setări.
  - Testat end-to-end; fără SMTP, în dev linkurile apar în consolă.
- **Lint/typecheck/unit** `38e3070`: `eslint.config.mjs`, `tsc --noEmit`, 58 teste Vitest. Testele au găsit un bypass SSRF pe IPv6 (B18), reparat.
- **Fixuri** `88086b7`: zoom permis (B12), cache-urile vechi ale SW șterse (B13), export cu basePath (B16, era stricat în producție), manifest duplicat (B14).
- **DB/Docker** `84f66c3`:
  - Migrație baseline idempotentă pentru `wine_log` (B17). Aplicată pe producție ca no-op, cu backup înainte.
  - `/health` verifică DB-ul și raportează `version`.
  - Containerul rulează `prisma migrate deploy` la pornire. Testat cu imaginea Docker locală pe o bază goală: 9 migrații aplicate, healthy.
- **E2E + CI** `ab2ab9f`:
  - 8 teste Playwright pe Postgres local (`npm run db:dev`); config-ul refuză DB-ul de producție.
  - Workflow: job `quality` (lint → typecheck → unit → migrații pe DB curat → drift → e2e), iar build-ul Docker rulează doar după el, pe `main`.
  - README rescris, `.env.example` complet.
- GitHub: #12, #13, #16–#21, #79–#83 pe „In Progress”, cu comentarii.

**Decizii:**
- **Email: Brevo** (gratuit, 300/zi, fără domeniu propriu; se verifică doar adresa expeditorului). Resend cere domeniu verificat, iar pe `go.ro` nu putem adăuga DNS. Codul e pe SMTP generic, deci la domeniul propriu (BIZ-002) schimbăm doar env-ul.
- Conturile neverificate nu sunt blocate la login (cele existente nu au email confirmat).
- Tag-ul `staging` e amânat: poarta de calitate din CI acoperă deocamdată riscul.

**Învățat / capcane:**
- `git push` pe HTTPS folosește alt cont (MarianSpiridon). Push-ul merge cu `git -c credential.helper= -c credential.helper='!gh auth git-credential' push`, dar fișierele din `.github/workflows` cer scope-ul `workflow` (`gh auth refresh -s workflow`).
- Linkurile din emailuri se construiesc din `NEXT_PUBLIC_APP_URL` (include `/crama`). `url`-ul primit de la better-auth pornește de la baseURL fără basePath.
- În e2e, butonul de consum devine „⏳” cât rulează acțiunea; testul trebuie să aștepte rezultatul (contorul de sticle), nu dispariția butonului.
- `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` arată drift-ul unei baze față de schemă; producția era deja identică.
- Next 16 nu mai are `next lint`; folosim `eslint .`.

**Rămas / next:**
- Scope `workflow` → push branch → PR → CI verde → checklist deploy → merge → teste după deploy → issue-urile trec pe „Done”.
- Cont Brevo + variabilele SMTP pe server.
- 0.4 Observabilitate, apoi Faza 1.

---

## 2026-10-07 — 0.2 Securitate (fără email)

**Făcut** (branch `fix/phase-0-stabilization`, toate testate la rulare cu useri de test, care au fost apoi șterși):
- **SEC-001** `6cd3b4e`: `user.shareEnabled` (default false), toggle și regenerare link în Setări (`ShareLinkSection`). Pagina publică cere `shareEnabled`, iar footer-ul folosește `Link` (basePath). Migrație aplicată pe DB: cele 2 colecții existente au devenit private, cu `shareId` păstrat.
- **SEC-002** `957c46e`: `utils/escape.js` (`escapeHtml`, `escapeCsv` cu protecție la formula injection), aplicate în export, plus CSP pe răspunsul HTML. Valoarea totală din export se înmulțește acum cu cantitatea.
- **SEC-003/004/005** `a03c663`:
  - `utils/minio.js` citește config doar din env, `ensureBucket` nu mai face bucket-ul public.
  - Upload: whitelist de foldere, sharp → WebP max 2000px, fără EXIF/GPS, respinge non-imagini.
  - Proxy `/api/media/[...key]`: acces pentru proprietar sau colecție publică activă; thumbnail-uri `?w=`.
  - Imaginile nefolosite se șterg la update/delete vin, la schimbarea avatarului și la ștergerea contului.
  - `scripts/cleanup-orphan-images.mjs` (dry-run) a găsit **23 orfane, 44 MB**, neșterse.
- **SEC-006** `c997aed`: `scripts/migrate-legacy-ai-keys.mjs --apply` a creat agentul „Cheie veche (migrată)” (openai, dezactivat, criptat) și a golit `user.aiApiKey`. Codul legacy a fost eliminat. Cheia Gemini merge acum în header, nu în URL. ai-scan sare agenții care nu se pot decripta.
- **SEC-009** `d8da57e`: rateLimit better-auth (sign-in 5/min/IP, sign-up 5/h etc.) plus `utils/rateLimit.js` pentru ai-scan, upload și parolă.
- Backup-uri înainte de fiecare modificare pe DB: `../vinerys-backups/*-pre-share-optin.dump`, `*-pre-ai-key-migration.dump`.

**Decizii:**
- **Expand/contract** pentru DB-ul partajat cu producția: aplicăm doar migrații compatibile cu codul vechi care încă rulează. Ștergerile de coloane (`aiApiKey`) și închiderea bucket-ului vin după deploy. Vezi „Checklist la următorul deploy” din ROADMAP.
- Imaginile rămân stocate în DB ca URL MinIO (compatibil cu codul vechi), iar afișarea trece prin proxy. Migrarea la chei pure de obiect rămâne pentru 1.3.
- Cheile obiectelor conțin `userId` ca prefix (`folder/<userId>_<ts>_<rand>.webp`): proxy-ul autorizează fără query în DB pentru proprietar.
- Rate limiting în memorie (o singură instanță). La scalare: Redis sau DB.

**Învățat / capcane:**
- `AI_CREDENTIALS_SECRET` local = cel din producție (cheile agenților se decriptează local). Nu se schimbă.
- Scripturile Node standalone nu pot importa `utils/*.js` care importă fără extensie (ESM strict). Scripturile din `scripts/` folosesc direct `minio`, `@prisma/client` și `utils/aiSecrets.js`.
- Codul vechi de upload genera chei `folder/<userId>_<ts>_<nume>`, iar URL-urile salvate au `/` codat ca `%2F`.
- better-auth limitează doar requesturile HTTP; apelurile `auth.api.*` din server actions trebuie limitate separat.

**Rămas / next:**
- SEC-007/008 (reset parolă, verificare email): aștept decizia D4 pentru provider-ul de email.
- Confirmare pentru ștergerea celor 23 imagini orfane.
- 0.3 Calitate și CI (Vitest pe escape, rateLimit, storage, consensus AI; lint; pipeline).

---

## 2026-10-07 — GitHub Project reorganizat + test la rulare 0.1

**Făcut:**
- Backup complet al DB-ului de producție: `../vinerys-backups/vinerys-20261007-145846.dump` (2 useri, 36 vinuri, 28 loguri, 4 agenți).
- GitHub: issue-urile Vinerys erau create în repo-ul `fotbal-genius` (#45–#130). Transferul privat → public nu e permis, așa că le-am recreat în `marickian-git/Vinerys` (#1–#80) cu labels și milestones M0–M9. Titlurile greșite („Milestone N”) au primit titlul corect, iar duplicatele (CELLAR-003/005, ARCH-001) au fost sărite. Originalele sunt închise cu link spre noul issue și scoase din proiect.
- Am adăugat 37 de issues noi (#81–#117) și milestone-urile M10–M14 (design bazat pe date, i18n, „Ce bem diseară?”, business, mobile).
- BUG-001…005 (#1–#5) sunt „In Progress”, cu comentariu despre branch.
- Test la rulare 0.1 cu un user de test pe DB-ul real:
  - consum 2 → 1 → 0 cu status `CONSUMED` și `consumptionDate`; al 3-lea consum e refuzat corect;
  - favorit logat; statisticile exclud vinul `CONSUMED`;
  - parola greșită dă mesaj corect, iar cea corectă se schimbă și login-ul cu parola nouă merge.
  - Userul de test a fost șters; numărătorile din DB sunt identice cu cele de dinainte.

**Decizii:**
- Commit-uri libere, push rar (push pe `main` = deploy automat). Pot lucra pe DB-ul de producție, dar fără pierderi de date: backup înainte de operații riscante, teste doar cu useri de test.
- Issue-urile rămân „In Progress” până ajung pe `main`, apoi trec pe „Done”.

**Învățat / capcane:**
- Backup și interogări fără pg_dump local: `docker run --rm postgres:17-alpine pg_dump -Fc "$DATABASE_URL"` (serverul e PostgreSQL 17.4).
- Test local: `NEXT_PUBLIC_APP_URL=http://localhost:3100/crama BETTER_AUTH_URL=http://localhost:3100 BASE_URL=/crama npx next dev -p 3100`. Sign-up: `POST /crama/api/auth/sign-up/email` cu header `Origin`.
- Server actions din curl: header `Next-Action: <id>`, cu id-ul luat din `.next/dev/server/**/server-reference-manifest.json`. Argumentele merg ca JSON. Pentru FormData: câmpuri `1_<nume>`, iar câmpul rădăcină `0=["$K1"]` trebuie trimis **ultimul** (busboy rezolvă referința la momentul parsării).
- Share URL-ul `…/crama/crama/<id>` e corect: basePath `/crama` + ruta `/crama/[shareId]`. Merită totuși redenumită ruta publică (ex. `/c/<id>`) la restilizare.

**Rămas / next:**
- 0.2 Securitate (SEC-001…009).

---

## 2026-10-07 — 0.1 Bug-uri critice

**Făcut** (branch `fix/phase-0-stabilization`, fără commit):
- `utils/actions.js`:
  - `consumeWine(id, quantity)`: server action nou. Rulează în tranzacție, cu decrement condiționat (`quantity >= amount`) ca să nu ajungem la stoc negativ. Când stocul ajunge la 0, setează `CONSUMED` + `consumptionDate` și scrie `WineLog` `CONSUMED`.
  - `WineLog` se scrie acum la create (`ADDED`), update (`UPDATED` cu diff from/to), delete (`DELETE`, înainte de ștergere) și favorite.
  - `updatePassword` folosește `auth.api.changePassword` cu headers și revocă celelalte sesiuni.
  - `getDashboardStats`: sticlele și valoarea numără doar `IN_CELLAR`, iar valoarea = `estimatedValue × quantity`.
- `components/wines/ConsumeButton.jsx` folosește `consumeWine`, deci nu mai face fetch și nu mai depinde de basePath.
- Am șters `app/api/wines/*` (Clerk mort) și `app/api/logs/route.js` (fișier gol).
- Dashboard: KPI-ul se numește acum „Sticle în pivniță”, cu subtitlul „N vinuri în pivniță”.
- `next build` trece.

**Decizii:**
- Consumul trece prin server action, nu prin API route: auth comun și fără probleme de basePath. Când facem `/api/v1` (Faza 1.1), ambele vor apela același serviciu.
- În tranzacție, log-ul se scrie direct (nu prin helper-ul care înghite erori). O eroare înghițită ar lăsa tranzacția Postgres abortată.
- Log-ul de istoric e best-effort în afara tranzacțiilor: nu blochează acțiunea principală.

**Învățat / capcane:**
- ⚠️ **B15:** `.env` și `.env.local` pointează la DB-ul de producție. Nu am testat la rulare. E nevoie de o DB locală (0.3) înainte de orice test manual sau e2e.
- `better-auth` aruncă `APIError` cu `body.code` (ex. `INVALID_PASSWORD`).
- `WineLog.wineId` are `onDelete: SetNull`, deci log-ul `DELETE` trebuie scris înainte de ștergere și supraviețuiește.

**Rămas / next:**
- Test manual al consumului, parolei și dashboard-ului pe o DB locală.
- 0.2 Securitate. Alternativ: întâi DB locală (B15), ca să putem testa tot ce urmează.
- Sincronizarea GitHub Project: lipsurile și duplicatele sunt listate în `ROADMAP.md` → „Corespondență GitHub Project”.

---

## 2026-10-07 — Cerință: redesign deosebit, bazat pe date

**Făcut:** am adăugat step-ul 2.0 „Inventar date → vizual” în `ROADMAP.md` (Faza 2), cu 12 idei de vizualizare.

**Decizii:**
- Redesign-ul nu e doar o temă nouă. Fiecare vin și fiecare pivniță primește o identitate vizuală generată din datele proprii (culoarea vinului, paleta etichetei, curba de maturitate, roata de arome, harta regiunilor, „portretul pivniței”).
- Machetele se fac cu date reale, nu cu placeholder.

**Învățat / capcane:**
- Unele vizualuri au nevoie de date pe care nu le avem încă sau care sunt incomplete: paleta etichetei (procesare imagini în 1.3), degustări multiple (`Tasting` în 1.2), locații structurate pe rafturi (4.1).
- Trebuie verificat cât de complete sunt datele reale înainte de design, ca să existe fallback-uri elegante pentru câmpurile lipsă.

**Rămas / next:**
- Înainte de 2.1: un raport de completitudine a datelor (ce procent din vinuri are fereastră, arome, imagine, regiune…).

---

## 2026-10-07 — Setup: audit + plan

**Făcut:**
- Am analizat complet proiectul (schema, actions, AI, API, UI, PWA, Docker, CI) → `docs/plan/AUDIT.md`.
- Am creat roadmap-ul în 7 faze → `docs/plan/ROADMAP.md`.
- Am creat `CLAUDE.md` în root, care cere citirea acestor fișiere la începutul fiecărei sesiuni.

**Decizii:**
- Prioritate: restilizare + ușurință în folosire, uz personal („Ce bem diseară?”), apoi explorare business.
- Ordinea: stabilizare → fundație (servicii, model de date, i18n, AI găzduit) → design → feature-uri → business → mobile.
- Multi-limbă de la fundație (RO + EN), ca designul să fie construit direct cu traduceri.
- Mobile la final, dar API-ul `/api/v1` se construiește din Faza 1, ca să nu rescriem logica.
- Business propus: B2C freemium → „Pașaport digital” pentru crame → restaurante (de validat cu interviuri).

**Învățat / capcane:**
- App-ul rulează sub basePath `/crama`. Orice `fetch` sau link absolut trebuie să treacă prin `appPath()` (`utils/appPath.js`). Vezi B1.
- `BASE_URL` se aplică la build-time: o schimbare cere rebuild.
- Deploy-ul pe `main` ajunge automat în producție (Watchtower), deci lucrăm pe branch-uri.
- Token-ul `gh` nu are scope pentru GitHub Projects. Trebuie rulat `gh auth refresh -s read:project,project`.

**Rămas / next:**
- Sincronizare roadmap ↔ GitHub Project (după acordarea scope-ului).
- Start Faza 0.1 (bug-uri critice) pe branch dedicat.
