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
