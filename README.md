# Leaderdle

Jeu web quotidien : deviner un dirigeant politique (chef d'État ou de gouvernement, depuis 1900). Quatre jeux par jour : Classic (cinq indices), Letters (épeler le nom, façon Wordle), Succession et Timeline. En bonus, Leader Mayhem : former un gouvernement de cinq dirigeants et le mener dans un tournoi, rejouable à volonté. Site 100 % statique, sans compte, progression enregistrée dans le navigateur.

Cahier des charges d'origine : `leaderdle-passation/PASSATION.md`. Les règles en viennent toujours. L'apparence, elle, a été refaite depuis (voir « Apparence ») : les maquettes et captures du dossier ne correspondent plus au site.

## Lancer le projet

```sh
npm install
npm run dev          # http://localhost:5173
npm test             # tests unitaires (Vitest)
npm run e2e          # tests de bout en bout (Playwright, bureau et téléphone, audit axe AA)
npm run build        # contrôle des données + build statique dans dist/
npm run e2e:build    # teste dist/ sur un serveur statique sans réécriture d'URL
npm run serve        # sert dist/ comme le ferait un hébergeur statique
```

Premier lancement de Playwright : `npx playwright install chromium`.

## Scènes de capture (dev)

Chaque état dessiné dans la passation s'affiche par l'adresse, comme dans le prototype :
`http://localhost:5173/?scene=won&theme=dark&colorblind=true`. Les scènes utilisent les 17 dirigeants d'exemple (`src/dev/`) et le puzzle n° 128.
`npm run shoot` photographie toutes les scènes dans `test-results/scenes/`. `npm run walk` joue une vraie journée avec les vraies données (`node scripts/walk.mjs 360` ou `1280 dark`).

## Apparence

Un dossier imprimé : papier clair, encre noire, un seul rouge (tampons, logo). Thème clair par défaut, thème sombre dans les réglages.

- Jetons et composants de base : `src/styles/base.css`.
- Polices auto-hébergées : Barlow Condensed (titres en capitales), Public Sans (texte), IBM Plex Mono (étiquettes).
- Tuiles : vert = exact, orange = proche ou lettre mal placée, gris = rien. Les mêmes couleurs dans les quatre jeux et dans le texte partagé.
- Icônes et image de partage : `node scripts/make-icons.mjs`.

## Données

| Fichier | Rôle |
|---|---|
| `public/data/leaders.json` | Dirigeants proposables, construits depuis Wikidata |
| `public/data/days/{n}.json` | Puzzle du jour n° n |
| `data/schedule.json` | Calendrier publié, **ajout seulement** : un jour publié ne change jamais |
| `data/overrides.json` | Corrections à la main sur Wikidata |
| `data/review.csv` | Fiches à relire avant la mise en ligne |
| `data/offices.json` | Titulaires successifs de chaque fonction (pour Succession) |

```sh
npm run data:fetch      # télécharge Wikidata dans data/raw/ (cache, non versionné)
npm run data:leaders    # reconstruit leaders.json, offices.json, review.csv
npm run data:schedule   # prolonge le calendrier (--upto=N)
npm run check:data      # valide tout, lancé aussi avant chaque build
```

Le guide de relecture est dans `data/README.md`.

## Réglages à fournir

Variables d'environnement au moment du build (fichier `.env`) :

- `VITE_LAUNCH_DATE` : date du puzzle n° 1, au format `AAAA-MM-JJ`. Par défaut `2026-07-11`, qui fait du 15 novembre 2026 le n° 128 comme dans les maquettes.
- `VITE_CONTACT_EMAIL` : adresse de contact (page Privacy et « Report an error »). Tant qu'elle manque, le bouton d'envoi est désactivé.

Restent dans le texte de la page Privacy : `[AD PARTNER]` et `[COOKIE LIST]` (`src/screens/Pages.tsx`).

## Architecture

- `src/game/` : règles du jeu en fonctions pures (comparaison des tuiles, mandats, recherche, indice, Timeline, partage, statistiques, dates).
- `src/store/` : état du jeu (réducteur) et sauvegarde, rangés par n° de puzzle, avec repli en mémoire si le stockage est bloqué.
- `src/data/` : schéma des fichiers (zod) et chargement (erreurs hors ligne et données manquantes).
- `src/components/`, `src/screens/` : interface React, CSS Modules, jetons de design dans `src/styles/base.css`.
- `scripts/` : construction des données, calendrier, contrôle, pages statiques par route, serveur statique de test.

Hébergement : n'importe quel hébergeur statique. Le build écrit un `index.html` par route et un `404.html`, aucune règle de réécriture n'est nécessaire. Un service worker garde le site jouable hors ligne une fois chargé.

## Leader Mayhem

- Règles et moteur : `src/game/mayhem.ts` (tirages, relances, duels, tournoi, tout dépend de la graine de la partie). `?seed=42` dans l'adresse impose les tirages.
- Notes : `data/mayhem-ratings.csv`, privées (jamais affichées aux joueurs). Voir `data/README.md`.
- `npm run mayhem:build` génère `public/data/mayhem.json`, `npm run mayhem:balance` simule des milliers de parties pour vérifier la difficulté (joueur qui connaît toutes les notes : environ 37 % de titres ; joueur au hasard : environ 4 %).
