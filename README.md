# Vinerys

Vinerys este o aplicație Next.js pentru gestionarea unei colecții de vinuri.

## Configurare

Variabilele server necesare sunt `DATABASE_URL`, `BETTER_AUTH_SECRET` și `AI_CREDENTIALS_SECRET`. Ultima este cheia de criptare pentru API keys salvate în agenții AI și trebuie păstrată stabilă între deploy-uri. Pentru fallback legacy sunt acceptate `GEMINI_API_KEY`, `GROQ_API_KEY` și `OPENROUTER_API_KEY`.

`BASE_URL` configurează subpath-ul la build-time. Normalizarea se face într-un singur loc:

```env
BASE_URL=/
# sau
BASE_URL=/crama
AI_CREDENTIALS_SECRET=un-secret-lung-si-stabil
```

Regulile sunt: valoare nedefinită sau goală -> `basePath: ""`, `/` -> `basePath: ""`, iar `crama`, `/crama` și `/crama/` -> `basePath: "/crama"`. `NEXT_PUBLIC_BASE_URL` este generat automat din valoarea normalizată și nu trebuie setat manual.

Next.js servește aplicația la `/crama`, inclusiv asset-urile și rutele interne. Reverse proxy-ul trebuie să transmită prefixul către container și să păstreze trailing path-ul, de exemplu `https://example.com/crama/` către `http://127.0.0.1:3989/crama/`. Pentru o schimbare de `BASE_URL` este necesar un rebuild.

## AI ensemble

Din Settings se pot adăuga mai mulți agenți Gemini, Groq, OpenRouter sau Claude. Cheile sunt criptate server-side și nu sunt trimise clientului. Agenții activi rulează în paralel; timeout-ul, retry-urile și greutatea sunt configurabile. Rezultatele sunt normalizate, votate ponderat per câmp și returnate ca precompletare. Un scan nu creează vin: salvarea se face o singură dată prin formularul de adăugare sau update.

Gemini, Groq și OpenRouter sunt opțiunile free-tier recomandate pentru cost redus, dar limitele și modelele disponibile se pot schimba. Verifică documentația providerului înainte de production. Claude este adaptor paid și poate fi folosit ca agent suplimentar.

### Provider registry și agenți custom

Catalogul server-side din `utils/aiProviderRegistry.js` include Gemini, Groq, OpenRouter, Anthropic, DeepSeek, Z.ai/GLM, OpenAI, Mistral, Cerebras, Together și Fireworks. Providerii cu API OpenAI-compatible folosesc același adaptor; pentru un serviciu nou se poate selecta `OpenAI-compatible`, cu un `Base URL` HTTPS și modelul furnizat de serviciu.

Modelele sunt descoperite live când providerul oferă endpoint de listare. Pentru scanarea etichetelor sunt folosiți numai agenții activați care declară suport `imageInput`; providerii text-only nu intră în ensemble. Un `Test agent` actualizează starea agentului: `Healthy`, `Model unavailable`, `Invalid credentials`, `Rate limited`, `Provider unavailable` sau `Needs attention`.

Cheile sunt criptate cu `AI_CREDENTIALS_SECRET`. Endpointurile custom sunt validate server-side: numai HTTPS, fără credentiale în URL și fără localhost, rețele private, link-local sau endpointuri de metadata. Redirecturile providerilor custom nu sunt urmate automat. Nu configura endpointuri interne.

`FREE`, `FREE-TIER`, `PAID` și `UNKNOWN` sunt etichete informative, nu garanții de preț. OpenRouter și modelele gratuite pot avea limite, disponibilitate și costuri schimbătoare. Agenții legacy bazați pe `GEMINI_API_KEY`, `GROQ_API_KEY` și `OPENROUTER_API_KEY` rămân fallback după agenții configurați în Settings.

## Rulare și migrații

```bash
npm install
npx prisma migrate dev
npm run dev
```

Pentru production:

```bash
npx prisma migrate deploy
npm run build
npm start
```

Nu schimba `AI_CREDENTIALS_SECRET` după salvarea agenților fără o migrare controlată a credentialelor.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

# Rulează backup manual oricând

/opt/vinerys/scripts/backup.sh

# Vezi backup-urile existente

ls -lh /opt/vinerys/backups/postgres/

# Citește logul

tail -30 /opt/vinerys/backups/backup.log

# Restaurează cel mai recent backup

/opt/vinerys/scripts/restore.sh

# Restaurează un backup specific

/opt/vinerys/scripts/restore.sh 2026-03-06

# Instalează sharp (doar dev)

npm install sharp --save-dev

# Rulează scriptul de generare

node scripts/generate-icons.mjs

# Migrații Prisma

docker exec vinerys-app npx prisma migrate deploy

# Restart aplicație

docker restart vinerys-app
