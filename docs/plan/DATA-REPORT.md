# Raport de completitudine a datelor — 2026-10-07 (DATA-009)

Datele reale de producție: 36 de vinuri (24 în pivniță = 29 de sticle, 11 consumate, 1 dăruit), 2 utilizatori.
Generat cu interogări read-only. Se reface înainte de fiecare decizie de design importantă.

## Completitudine pe câmp

| Câmp | % | Observații |
|---|---|---|
| Nume, țară, an, alcool, potențial (text), asocieri mâncare, note degustare, temp. servire | 100% | Completate de scanarea AI |
| Fereastră de consum (`drinkFrom`/`drinkUntil`) | 97% | ✅ curba de maturitate e viabilă |
| Soiuri | 97% | |
| Poză etichetă | 97% | ✅ paleta generată din etichetă e viabilă |
| Valoare estimată | 97% | |
| Producător, regiune, data achiziției | 94% | |
| Arome | 86% | Vocabular liber, cu duplicate (vezi „Calitate”) |
| Poză sticlă | 86% | |
| Locație în pivniță | 81% | Text liber: zone ale casei, nu rafturi |
| Preț achiziție | 78% | |
| **Rating** | **25%** | ⚠️ puține; trebuie colectate după degustare (HOME-005) |
| **Culoare** | **14%** | ⚠️ se poate deriva automat din tip + soiuri |
| Favorit | 11% | |

## Cum arată colecția

- **Tipuri:** 20 roșii, 7 rosé, 6 albe, 2 spumante, 1 fortifiat. Aproape toate sticlele au 0.75L (o singură sticlă de 0.375L).
- **Țări (11):** România 10 (+1 scris „Romania”), Italia 9, Spania 4, Franța 4, Moldova 3, apoi câte unul: Bulgaria, Grecia, Argentina, Portugalia, Chile.
- **Soiuri de top:** Cabernet Sauvignon 8, Merlot 8, Tempranillo 4, Sauvignon Blanc 4, Syrah 3, Fetească Neagră 2.
- **Ani:** 2002–2025, **mediana 2023**, deci în general vinuri tinere, de băut în câțiva ani.
- **Fereastra de consum (vinurile din pivniță):** **22 din 24 sunt „la vârf acum”**, 1 a trecut de vârf, 1 e încă tânăr.
- **Locații:** Lada, Frigider, Lada afară, Bucătărie, Cameră, Dulap bucătărie.
- **Istoric:** `wine_log` are doar 28 de scanări AI. Celelalte acțiuni se înregistrează abia de acum.

## Probleme de calitate a datelor

- **Duplicate cu/fără diacritice sau spații:** „România”/„Romania”, „Frigider”/„Frigider ”, „Bucatarie” ×2, „coacăze”/„coacaze”, „lamaie”. Avem nevoie de vocabulare canonice (țări, locații, arome) și de o normalizare la salvare (DATA-010).
- **Arome în text liber:** pentru roata de arome trebuie mapate pe categorii (fructe roșii, fructe negre, citrice, flori, condimente, lemn/prăjit, pământ/mineral, dulce).
- **Culoarea** lipsește aproape peste tot, dar se poate deriva din tip (+ soiuri pentru rosé/orange).

## Concluzii pentru design (DESIGN-001 / DESIGN-002)

1. **„Ce bem diseară?” e esențial, dar trebuie să facă diferența *în interiorul* ferestrei.** Când 22 din 24 de vinuri sunt „la vârf”, un simplu badge verde nu ajută. Scorul de urgență (HOME-001) trebuie să ordoneze după cât timp a mai rămas până la `drinkUntil`, după cantitate și după cât de vechi e vinul în fereastră.
2. **Curba de maturitate:** date pentru 97% din vinuri, deci poate fi elementul vizual principal pe detaliu și pe card.
3. **Identitate vizuală din etichetă:** 97% au poză. Paleta extrasă din etichetă poate colora fiecare card. Fallback: culoarea vinului.
4. **Culoarea vinului:** derivată automat (roșu rubiniu / granat după vârstă, rosé somon, alb pai / auriu, spumant), ca accent pe card.
5. **„Harta pivniței” = zone ale casei, nu rafturi.** Lada, Frigider, Bucătărie, Cameră: vizualizare pe zone (camere / mobilier), cu posibilitatea de rafturi mai târziu (CELLAR-001).
6. **Rating-urile trebuie colectate activ:** prompt după „Deschide sticla” (HOME-005). Fără ele, profilul de gust (AI-011) nu are date.
7. **Harta lumii:** 11 țări, cu România și Italia dominante. Merită o hartă/amprentă geografică, cu accent pe regiuni.
8. **Siluete de sticle:** aproape toate de 0.75L, deci diferențierea prin mărime aduce puțin. Stocul se arată prin număr de sticle, nu prin mărime.
9. **Note degustare 100%, dar generate de AI.** În UI trebuie separat clar „note AI” de „notele mele”.
