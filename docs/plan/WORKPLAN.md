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
| 11 | #123 | CI-008 Smoke test producție | done | | `scripts/smoke-prod.mjs` + `npm run smoke:prod`: 10 pași, cont de test creat și șters în `finally`, așteaptă `version` din `/health`, webhook la eșec. Verificat local 10/10 (fără MinIO). Fără job programat în GitHub Actions: modificarea workflow-urilor cere scope-ul `workflow`; se rulează manual după deploy |
| 12 | #104 | HOME-003 Vin → mâncare | done | | Secțiunea „Ce gătesc cu el?” pe pagina vinului: 3 preparate + temperatură + decantare + pahar, generate cu agenții utilizatorului (fallback pe rând), cache pe vin (`pairing`/`pairingKey`, migrație), invalidat când se schimbă identitatea vinului. Consumul AI intră în `ai_usage` |
| 13 | #55 | CELLAR-009 Căutare fuzzy (pg_trgm) | done | | pg_trgm (`word_similarity` pe nume/producător, fără diacritice cu `translate`) + căutare în regiune/soiuri/arome/asocieri/note + limbaj natural (tip, „gata de băut”, „trecute de vârf”, sub/peste preț, an, favorite). Filtre salvate (max 20). 2 migrații. Moneda în „lei/€” e ignorată; prețul se compară cu valoarea salvată (multi-currency = #35) |
| 14 | #57 | SOCIAL-001 Vinerys Wrapped | done | | Pagina `/wrapped?year=` ca o poveste verticală de carduri: sticle, țări, soiul anului, ritmul pe luni, producătorul preferat, cea mai scumpă sticlă, preferatele, pivnița azi. Distribuire prin Web Share / clipboard. Istoricul vechi vine din `consumptionDate`. Fără imagine generată și fără pagină publică (vin cu designul nou, #94) |
| 15 | #77 | REFACTOR-006 Sentry (opțional, pe DSN) | todo | | |

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

