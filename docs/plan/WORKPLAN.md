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
| 1 | #76 | REFACTOR-005 Logging structurat | done | | Logger propriu fără dependențe (merge și în edge) în loc de pino: JSON în producție, secrete redactate, email mascat, `LOG_LEVEL`, latență per agent AI. Costul AI vine în #88 |
| 2 | #75 | REFACTOR-004 Error handling standard | done | | `utils/errors.js`: `AppError` + coduri, `withApiHandler` (requestId, log, 500 generic) pe upload/export/ai-scan; actions aruncă AppError. Corpul JSON păstrează `error`, deci clienții existenți merg; se adaugă `code` + `requestId` |
| 3 | #28 | ARCH-007 Scheme Zod comune | done | | `schemas/` (wine, account, ai): aceleași scheme pentru actions, `/api/ai-scan` și, pe viitor, formulare client și `/api/v1`. Mesajele de eroare au rămas identice. Response schemas: amânat la ARCH-008 (#84), când există un API public |
| 4 | #120 | DATA-010 Normalizare și vocabulare | done | | `utils/normalize.js` + normalizare la salvare + `scripts/normalize-wines.mjs` (dry-run/backup/raport). Autocomplete: `datalist` pentru țări/locații (minim, fără restilizare). Culoarea derivată nu ghicește la spumant/desert cu soiuri mixte. **De rulat pe producție:** dry-run, apoi `--apply` |
| 5 | #34 | DATA-006 Statistici prin agregări DB | done | | `groupBy`/`aggregate`/SQL în DB în loc de încărcarea tuturor vinurilor. Pentru fereastra de consum se încarcă doar vinurile `IN_CELLAR`. `getCurrentUser` cu `cache()` (o citire a sesiunii pe request). Forma răspunsului e identică |
| — | | **Checkpoint 1** | | | |
| 5b | nou | Teme propuse de Claude (2–3), ca opțiune de ales | todo | | Cerut de utilizator pe 11.10. Izolate în fișiere proprii ca să nu intre în conflict cu temele A–E de pe branch-ul local |
| 6 | #43 | AI-008 Cache scanări (hash imagine) | todo | | |
| 7 | #88 | AI-013 Tracking cost AI | todo | | |
| 8 | #111 | BIZ-004 GDPR: export date + pagini legale | todo | | |
| 9 | #64 | INT-001 Import CSV Vivino | todo | | |
| 10 | #65 | INT-002 Import CSV CellarTracker | todo | | |
| — | | **Checkpoint 2** | | | |
| 11 | #123 | CI-008 Smoke test producție | todo | | |
| 12 | #104 | HOME-003 Vin → mâncare | todo | | |
| 13 | #55 | CELLAR-009 Căutare fuzzy (pg_trgm) | todo | | |
| 14 | #57 | SOCIAL-001 Vinerys Wrapped | todo | | |
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

_(se completează la fiecare 5 issue-uri)_
