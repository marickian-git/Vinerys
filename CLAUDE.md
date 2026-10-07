# Vinerys

Pivniță digitală (Next.js 16 + React 19 + Prisma 7/PostgreSQL + better-auth + MinIO + AI ensemble).
Limba de lucru cu utilizatorul: **română**.

## Înainte de orice task

Citește planul din `docs/plan/`:
- `ROADMAP.md`: fazele, pașii, deciziile și statusul curent
- `JOURNAL.md`: ce s-a făcut, deciziile și capcanele (cea mai nouă intrare e prima)
- `AUDIT.md`: problemele găsite inițial (B1…B14) și statusul lor

## După fiecare step terminat

1. Bifează step-ul în `ROADMAP.md` și actualizează statusul fazei.
2. Adaugă o intrare în `JOURNAL.md` (Făcut / Decizii / Învățat / Next).
3. Dacă ai rezolvat o problemă din `AUDIT.md`, marchează-o ✅ și notează commit-ul.
4. Dacă s-a luat o decizie, actualizează tabelul de decizii din `ROADMAP.md`.

## Reguli și capcane

- App-ul rulează sub basePath `/crama` (setat la build din `BASE_URL`). Orice `fetch`/link absolut trece prin `appPath()` din `utils/appPath.js`.
- Push pe `main` = deploy automat în producție (GitHub Actions → Docker Hub → Watchtower). Lucrează pe branch-uri și fă commit doar la cerere.
- Cheile AI sunt criptate cu `AI_CREDENTIALS_SECRET`, care nu se schimbă fără o migrare a credențialelor.
- Migrații: `npx prisma migrate dev` local; în producție `docker exec vinerys-app npx prisma migrate deploy`.
