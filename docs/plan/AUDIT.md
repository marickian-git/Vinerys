# Audit inițial — 2026-10-07

Starea proiectului la commit `c0473ae`. Bifează problemele când sunt rezolvate și notează commit-ul.

## Puncte forte (de păstrat)

- Pipeline AI ensemble (`utils/aiProviders.js`): agenți paraleli, retry, vot ponderat per câmp, fereastră de consum cu „basis”.
- Chei AI criptate AES-256-GCM (`utils/aiSecrets.js`), protecție SSRF pentru endpointuri custom (`utils/aiUrlSecurity.js`).
- Stack modern: Next 16, React 19, Prisma 7 (adapter pg), better-auth, Zod 4.
- Deploy automat: GitHub Actions → Docker Hub (amd64+arm64) → Watchtower pe serverul de acasă, sub `/crama`.
- Identitate vizuală coerentă (bordo `#8b1a2e`, roz `#c44569`, auriu `#d4af37`, Cormorant Garamond + Jost).

## Bug-uri și probleme

| ID | Status | Problemă | Locație |
|---|---|---|---|
| B1 | ✅ `fix/phase-0-stabilization` | Butonul de consum e stricat: ruta folosește `auth()` Clerk neimportat și câmpul `clerkId`, care nu există. Fetch-ul nu folosește `appPath`, deci sub `/crama` lovește URL-ul greșit. | `app/api/wines/[id]/consume/route.js`, `components/wines/ConsumeButton.jsx:20` |
| B2 | ✅ `fix/phase-0-stabilization` | Toate rutele `app/api/wines/*` sunt cod Clerk vechi și nefuncțional | `app/api/wines/` |
| B3 | ✅ `fix/phase-0-stabilization` | Schimbarea parolei face un fetch server-side fără cookie-uri, deci eșuează cu mesajul greșit „parola curentă e incorectă” | `utils/actions.js` → `updatePassword` |
| B4 | ✅ `fix/phase-0-stabilization` | „Valoare colecție” adună `estimatedValue` fără să înmulțească cu cantitatea și include consumate/vândute | `utils/actions.js` → `getDashboardStats` |
| B5 | ✅ `fix/phase-0-stabilization` | `WineLog` se scrie doar la scan AI, deci nu există istoric | `utils/actions.js` |
| B6 | ✅ `6cd3b4e` | Fiecare user are colecția publică din oficiu (`shareId` cu default cuid), fără opțiune de dezactivare sau regenerare. Linkurile din footer nu folosesc basePath. | `prisma/schema.prisma`, `app/crama/[shareId]/page.js` |
| B7 | ✅ `957c46e` | Exportul PDF/HTML pune numele vinurilor în HTML fără escaping (XSS) | `app/api/export/route.js` |
| B8 | ✅ `a03c663` | MinIO are fallback `minioadmin/minioadmin` și hostname hardcodat, `useSSL:false`, bucket public. `folder` vine nevalidat de la client. Pozele nu se redimensionează (max 5MB brut) și nu se șterg la delete vin/cont. Există un client duplicat. | `utils/minio.js`, `app/lib/minio.js`, `app/api/upload/route.js` |
| B9 | ✅ `c997aed` | `User.aiApiKey` ține cheia AI în plaintext (legacy) | `prisma/schema.prisma` |
| B10 | 🟨 rate limiting `d8da57e`; email rămas | Lipsesc resetarea parolei, verificarea emailului și rate limiting-ul | auth, `api/ai-scan`, `api/upload` |
| B11 | ✅ `a03c663` | `deleteAccount` nu șterge imaginile din MinIO | `utils/actions.js` |
| B12 | ⬜ | `viewport.userScalable=false` blochează zoom-ul (accesibilitate) | `app/layout.js` |
| B13 | ⬜ | Service worker-ul cachează pagini cu date private (`/dashboard`, `/wines`) | `public/sw.js` |
| B15 | ⬜ | `.env` / `.env.local` folosesc DB-ul **de producție** (`casa-spiridus.go.ro:5432`) și pentru dev → orice test local modifică date reale | `.env`, `docker-compose.dev.yml` |
| B14 | ⬜ | `public/manifest.json` (static, fără basePath) duplică `app/manifest.js` | `public/` |

## Datorie tehnică

- **Styling:** ~30 de fișiere cu blocuri `<style>` inline, ~22 de `@import` Google Fonts la runtime, ~100 de `style={{}}`. Tailwind și daisyUI sunt instalate, dar aproape nefolosite. Culorile sunt hardcodate peste tot.
- **Fișiere mari:** `WineForm.jsx` (1222 linii), `AISettingsSection.jsx` (953), `dashboard/page.js` (909), `utils/actions.js` (708).
- **Limbaj și organizare:** JS și TS amestecate. `package.json` se numește `nextjs-tutorial`, README-ul conține boilerplate.
- **Fără teste.** CI-ul face build și push direct pe `latest`, fără lint, typecheck, teste sau migrații automate.
- **Statistici:** încarcă toate vinurile în memorie. Dashboard-ul apelează `getCurrentUser` de 4 ori.
- **Model de date:** un rând `Wine` înseamnă N sticle, deci nu se pot urmări sticle individuale.
- **Monedă și limbă:** moneda e fixă pe €, textele sunt hardcodate în română.
- **AI:** utilizatorul trebuie să-și aducă propriile chei API, o barieră pentru utilizatorii non-tehnici.
- **Infrastructură:** totul rulează pe serverul de acasă (`casa-spiridus.go.ro`), cu MinIO pe HTTP la portul 9010.
