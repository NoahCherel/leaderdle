# Leaderdle — document de passation pour le développement

Version du 15 novembre 2026. Interface du jeu en anglais, ce document en français.

Leaderdle est un jeu web quotidien où l'on devine un dirigeant politique (chef d'État ou de gouvernement, du monde entier, de 1900 à aujourd'hui). Un jeu principal, Classic, et deux bonus courts, Succession et Timeline. Un puzzle par mode et par jour, identique pour tous, sans compte.

Ce dossier contient tout ce qu'il faut pour développer le site. Le design est terminé. La base de données des dirigeants et le calendrier des puzzles ne le sont pas : voir « Ce qui reste à faire ».

## 1. Contenu du dossier

| Élément | Rôle |
|---|---|
| `PASSATION.md` | Ce document. À lire en premier. |
| `brief-original.txt` | Le brief produit d'origine. Source des règles du jeu. |
| `prototype/prototype.html` | Le jeu complet et jouable dans un seul fichier. Référence pour le comportement. |
| `captures/` | 90 captures de tous les écrans et états : bureau 1280 px, mobile 360 px, tablette 768 px, thème clair, mode daltonien. Référence pour l'apparence. |
| `donnees/design-tokens.json` | Couleurs, typographie, formes, points de rupture, animations. |
| `donnees/leaders.json` | Les 17 dirigeants du prototype et les puzzles d'exemple. |
| `assets/` | `favicon.svg`, icônes PNG (512, 180, 32 px), `og-image.png` (1200 × 630). |
| `maquette-source/` | Les fichiers sources du canevas de design. Archive, voir la mise en garde ci-dessous. |

### Comment utiliser le prototype

Ouvrir `prototype/prototype.html` dans un navigateur. Les polices viennent de Google Fonts, donc une connexion est nécessaire pour le rendu exact.

Chaque état peut être affiché directement par l'adresse, ce qui a servi à produire les captures :

`prototype.html?scene=won&compact=true&theme=light&colorblind=true`

- `scene` : `home-first`, `home-progress`, `home-done`, `home-complete`, `empty`, `progress`, `resumed`, `suggest`, `nomatch`, `typing`, `hint`, `hint-used`, `won`, `won-hint`, `lost`, `help`, `stats`, `settings`, `s-empty`, `s-progress`, `s-won`, `s-lost`, `t-start`, `t-progress`, `t-won`, `t-lost`, `summary`, `about`, `how`, `privacy`, `report`, `consent`, `err-offline`, `err-data`, `err-404`. Sans `scene`, le jeu est vivant.
- `compact=true` force la mise en page téléphone, `tablet=true` le format publicitaire étroit.
- `theme=light`, `colorblind=true`.

### Mise en garde sur le code du prototype

Le prototype est une maquette, pas une base de code. Tout est dans un fichier, avec les styles en ligne et un petit moteur de rendu maison (`DCLogic`, balises `sc-if`, `sc-for`). **Ne pas reprendre cette structure.** Reconstruire le site avec les outils du projet, en reprenant du prototype :

- la logique de jeu, lisible dans la classe `Component` (`compare`, `status`, `submit`, `swap`, `target`, `load`, `save`) ;
- les textes d'interface, tous définitifs sauf mention contraire ;
- les valeurs visuelles, reprises dans `design-tokens.json`.

Les fichiers de `maquette-source/` (`*.dc.html`) ne s'ouvrent que dans l'outil de design. Seul `App.dc.html` a un intérêt : c'est la source de `prototype.html`. Les fichiers `A-*`, `B-*`, `A1/A2/A3-Desktop` et `Main.dc.html` sont des pistes abandonnées.

## 2. Décisions qui remplacent le brief

Le brief d'origine reste valable sauf sur ces points, décidés pendant le design.

| Sujet | Brief | Décision finale |
|---|---|---|
| Écran de référence | Mobile d'abord, 360 px | **Bureau d'abord** (1280 px), puis adaptation tablette et téléphone |
| Thème par défaut | Clair, sombre en option | **Sombre (« Nuit ») par défaut**, clair en option dans les réglages |
| Palette | Section 3 du brief (crème, violet #6C4CF1, turquoise, corail) | **Palette Nuit**, voir `design-tokens.json` |
| Tuiles sur bureau | Non précisé | Texte complet (« United Kingdom », « Head of government »). Codes courts (GBR, Gov) sur téléphone seulement |
| Accueil sur bureau | Trois cartes puis publicité | Colonne de droite : état du jour, statistiques Classic, compte à rebours, publicité 300 × 250 |

Tout le reste du brief s'applique : neutralité politique, aucune image de personne réelle, pas de compte, un essai par jour, textes en anglais.

## 3. Fondations visuelles

Valeurs complètes dans `donnees/design-tokens.json`. L'essentiel :

| Jeton | Sombre | Clair | Usage |
|---|---|---|---|
| `ground` | #1C1A2B | #FBF3E4 | Fond de page |
| `surface` | #2A2740 | #FFFDF8 | Cartes, champ, fenêtres |
| `text` | #FFF4DE | #1C1A2B | Texte courant |
| `muted` | #B9B3CC | #5B5670 | Texte secondaire, étiquettes |
| `outline` | #0A0912 | #1C1A2B | Contours 2 px et ombres décalées |
| `ink` | #14121F | #14121F | Texte posé sur une couleur vive |
| `mode-classic` | #9B87FF | idem | Carte, pastille, boutons de Classic |
| `mode-succession` | #3DD6C3 | idem | Idem pour Succession |
| `mode-timeline` | #FF9D5C | idem | Idem pour Timeline |
| `correct` | #4ADE80 | idem | Tuile juste (daltonien : #6CB6FF) |
| `close` | #FFD23F | idem | Tuile proche (daltonien : #FF9A3D) |
| `no-match` | #454160 | #D9D3E6 | Tuile fausse |

- **Typographie** : Fredoka 600 et 700 pour le logo, les titres et les boutons principaux. DM Sans 400, 500, 700 pour l'interface. Chiffres à largeur fixe (`tabular-nums`) dans les tuiles et les compteurs.
- **Style « sticker »** : contour de 2 px, ombre dure décalée sans flou (3, 4 ou 5 px), coins arrondis (12 px tuiles et boutons, 20 px cartes, pastilles entièrement rondes). Un bouton pressé se décale de 2 px vers le bas et la droite.
- **Texte sur couleur** : toujours `ink` sur les trois couleurs de mode et sur vert et jaune. Pas de texte blanc sur ces couleurs, le contraste AA ne passe pas.
- **Jamais de rouge pour une erreur**, jamais d'opposition rouge contre bleu.
- **Largeur maximale** du contenu : 1120 px, centré.

## 4. Structure et navigation

| Écran | Contenu | Captures |
|---|---|---|
| Accueil | Carte Classic dominante, deux cartes bonus, bloc « How it works », pied de page. Colonne de droite : état du jour, statistiques, compte à rebours, publicité | `01-accueil/` |
| Classic | Pastilles de mode, titre et essais restants, champ, lignes d'essais | `02-classic/` |
| Succession | Chaîne de trois cases, champ, indices, erreurs | `03-succession/` |
| Timeline | Cinq cartes à ordonner, bouton de validation | `04-timeline/` |
| Synthèse du jour | Badge Perfect day, trois résultats, partage groupé | `05-journee-complete/` |
| Fenêtres | Aide (une par mode), statistiques (un onglet par mode), réglages | `06-fenetres/` |
| Pages | About, How we pick and describe leaders, Privacy, Report an error | `07-pages/` |
| Consentement, erreurs | Bandeau de cookies, hors ligne, données indisponibles, 404 | `08-consentement-erreurs/` |

- **En-tête, partout** : logo qui ramène à l'accueil, série en cours avec flamme, puis aide, statistiques, réglages (boutons de 44 px).
- **Pastilles de mode** : sur chaque écran de jeu, elles passent d'un mode à l'autre sans revenir à l'accueil. Rien n'est verrouillé, l'interface pousse seulement Classic en premier.
- **Fin de partie** : le résultat s'affiche sur l'écran du mode, avec un bouton « Next up: … » vers le premier mode non terminé, puis « See today's summary » quand les trois sont finis.
- **Aide** : s'ouvre seule à la première visite de chaque mode.
- L'accueil doit pouvoir recevoir une quatrième carte de mode plus tard.

## 5. Règles de jeu

### Classic (8 essais)

Le joueur saisit un nom. Chaque essai ajoute une ligne de cinq tuiles, la plus récente en haut, les en-têtes de colonnes restant visibles.

| Tuile | Juste (vert) | Proche (jaune) | Flèche |
|---|---|---|---|
| Country | Même pays | Même continent | Aucune |
| Role | Même fonction | Une fonction en commun (l'un des deux est « Both ») | Aucune |
| Took office | Même année | Écart de 10 ans au plus | Vers la cible : haut = later, bas = earlier |
| Years in office | Même durée | Écart de 2 ans au plus | Haut = more, bas = fewer |
| Age at start | Même âge | Écart de 5 ans au plus | Haut = older, bas = younger |

- La flèche s'affiche sur les tuiles jaunes et grises des trois colonnes chiffrées.
- Role prend trois valeurs : Head of state, Head of government, Both.
- Plusieurs mandats séparés : Took office = première prise de fonction, Years in office = total cumulé, arrondi à l'année inférieure. Age at start = âge au jour de la première prise de fonction.
- Dirigeant encore en poste : durée comptée jusqu'à aujourd'hui, avec une étiquette « In office » sur la tuile (spécimen dans la bibliothèque de composants).
- **Indice** : après cinq essais ratés, un bandeau propose « Reveal initials ». L'utiliser ne coûte pas d'essai, affiche les initiales (« A. M. ») et ajoute une ampoule 💡 au résultat partagé.

### Succession (5 essais)

Trois cases : le prédécesseur, une case mystère, le successeur. Seuls les deux noms sont affichés. Même champ de saisie que Classic. Chaque erreur dévoile un indice, dans cet ordre : années, fonction, continent, pays. À la fin, la case mystère se retourne et la chaîne affiche ses dates.

### Timeline (3 validations)

Cinq cartes (nom et pays) à ranger de la prise de fonction la plus ancienne à la plus récente. Après chaque validation, les cartes bien placées se verrouillent en vert et ne bougent plus. À la fin, une frise affiche les années.

- Déplacement par glisser-déposer **et** par les boutons monter et descendre de chaque carte. Un déplacement saute par-dessus les cartes verrouillées.
- Le prototype n'a que le glisser-déposer à la souris. **À faire** : un vrai glisser tactile, confortable au pouce.

### Communs

- Un puzzle par mode et par jour, identique pour tous, avec une réponse différente dans chaque mode. Nouveau puzzle à minuit, heure locale du joueur.
- Un puzzle terminé ne se rejoue pas. Le résultat reste consultable, avec le compte à rebours.
- La réponse du jour est toujours un dirigeant connu du grand public. Les dirigeants plus obscurs peuvent être proposés comme essais, jamais comme réponse.

## 6. Composants et états

| Composant | Variantes et états | Notes |
|---|---|---|
| Tuile | Juste, proche, fausse, version daltonienne, « In office » | Hauteur minimale 68 px. L'état n'est jamais porté par la couleur seule : pastille « coche » pour juste, pastille « vague » pour proche, aucune pour faux |
| Ligne d'essai | Nom et pays au-dessus, cinq tuiles en grille égale | Nom long : passe sur deux lignes sans casser la grille |
| Champ avec suggestions | Vide, en saisie, liste ouverte, aucun résultat, nom déjà proposé, saisie invalide | Voir ci-dessous |
| Carte de mode | À jouer, en cours, réussi, raté | Pastille d'état en haut à droite, bouton dont le libellé suit l'état |
| Pastille de mode | Active (couleur du mode, ombre), inactive (surface), terminée (point clair) | 44 px de haut |
| Boutons | Principal (couleur du mode), sur carte (clair), secondaire (contour), icône seule, désactivé (opacité 45 %) | |
| Interrupteur | On (vert, « On »), Off (fond, « Off ») | Libellé écrit, pas seulement la couleur |
| Fenêtre | Aide, statistiques, réglages | 520 px de large au plus, voile sombre, un bouton de fermeture clair en bas |
| Bulle de confirmation | « Copied to clipboard », « Your data was cleared » | En bas au centre, disparaît après 2,4 s |
| Fiche du dirigeant | Fin de Classic et de Succession | Drapeau, nom, pays, fonction, dates, une phrase neutre, lien Wikipedia, lien discret « Report an error » |
| Emplacement publicitaire | 300 × 600, 300 × 250, 320 × 100, état vide | Étiquette « Advertisement » au-dessus, taille réservée dès l'affichage |
| Bandeau de consentement | Affiché tant qu'aucun choix n'est fait | Deux boutons de même taille et de même style : Decline, Accept |

### Champ de saisie

- La liste s'ouvre dès que le champ a le focus, et se filtre à la frappe.
- Chaque suggestion affiche le nom, le pays et le mandat, pour distinguer les homonymes.
- La recherche ignore la casse et les accents et accepte des variantes (« FDR », « JFK », « Queen Elizabeth »). À étendre : translittérations, particules, noms d'usage.
- Un nom déjà proposé reste dans la liste, grisé, avec « Already guessed ».
- Clavier : flèches haut et bas pour parcourir, Entrée pour valider, Échap pour fermer.
- Saisie invalide : secousse douce du champ et message sous le champ (« No leader found. Check the spelling? », « You already tried … », « Type a name, or pick one from the list. »).
- Liste longue : 330 px de haut au plus, puis défilement.

## 7. Comportement selon la largeur

| Largeur | Changements |
|---|---|
| Bureau, 1000 px et plus | Deux colonnes. Publicité 300 × 600 à droite de la zone de jeu. Tuiles avec texte complet |
| Tablette, 620 à 999 px | Une colonne. Publicité 320 × 100 sous la zone de jeu. Tuiles avec texte complet |
| Téléphone, moins de 620 px | Une colonne. Tuiles avec codes courts (GBR, Gov). Logo réduit à 21 px. La liste de suggestions pousse le contenu au lieu de le recouvrir |

- **Clavier mobile ouvert** : au focus, le champ remonte en haut de l'écran pour que la suggestion et le dernier essai restent visibles au-dessus du clavier (capture `mobile-360/02-classic/06-typing.png`).
- Cinq tuiles tiennent sur une ligne à 360 px.
- Zones cliquables de 44 px au minimum.

## 8. Publicité

Emplacements autorisés, et aucun autre :

- Bureau : colonne 300 × 600 à droite de la zone de jeu, bloc 300 × 250 dans la colonne de droite de l'accueil et sur la synthèse.
- Tablette et téléphone : bloc 320 × 100 sous la zone de jeu, atteint en faisant défiler, bloc 300 × 250 sous les cartes de l'accueil.

Interdits : plein écran, fenêtre surgissante, vidéo en lecture automatique, son, publicité avant de pouvoir jouer ou entre le champ et les essais, bandeau fixe qui recouvre le clavier ou le champ, tout bloc qui décale la page en se chargeant. Les annonces politiques sont exclues côté régie.

## 9. Partage, séries et statistiques

Textes copiés, sans jamais divulguer la réponse :

```
Leaderdle #128 · Classic 4/8
⬜🟩⬆️⬇️⬆️
🟨🟩⬆️⬆️🟨
⬜🟨⬆️⬆️⬇️
🟩🟩🟩🟩🟩
leaderdle.com
```

- Classic : une ligne par essai. 🟩 juste, 🟨 proche, ⬆️ ou ⬇️ pour une tuile chiffrée fausse, ⬜ pour une tuile fausse sans flèche. Score `X/8` en cas de défaite. Ampoule 💡 après le score si l'indice a servi.
- Succession : une seule ligne, un carré par essai (`⬜🟩`).
- Timeline : une ligne de cinq carrés par validation.
- Journée : `Leaderdle #128` puis `Classic 4/8 · Succession 2/5 · Timeline 2/3` puis `leaderdle.com`.
- Sur téléphone, ouvrir la feuille de partage du système. Ailleurs, copier dans le presse-papiers et confirmer par une bulle.

Séries et statistiques :

- La série compte les jours consécutifs où Classic a été **terminé**, gagné ou perdu. Les bonus ne la modifient pas.
- Badge « Perfect day » quand les trois modes sont réussis le même jour.
- Par mode : parties jouées, taux de réussite, série de victoires en cours, meilleure série, répartition des scores en barres.
- Tout est stocké dans le navigateur, avec la mention « Your stats are saved on this device only. ». Le prototype utilise la clé `leaderdle-v1` de `localStorage`. « Clear my data » efface tout.

## 10. Animations

| Élément | Déclencheur | Animation | Durée |
|---|---|---|---|
| Tuiles d'un essai | Essai validé | Retournement une à une | 380 ms par tuile, 130 ms de décalage |
| Champ de saisie | Saisie invalide | Secousse horizontale douce | 360 ms |
| Confettis | Victoire | Chute depuis le haut du bloc de résultat | 1,6 s |
| Case mystère de Succession | Victoire | Retournement | 420 ms |
| Bouton | Pression | Décalage de 2 px | Immédiat |

Avec le réglage « Reduce motion » ou la préférence système `prefers-reduced-motion`, toutes les animations sont coupées et les états s'affichent directement. Les animations fêtent le joueur (« You got it! »), jamais le dirigeant.

## 11. Accessibilité

- **Couleur jamais seule** : chaque état de tuile porte une pastille ou une flèche. Mode daltonien : bleu et orange à la place du vert et du jaune.
- **Contraste** : niveau AA au minimum partout, y compris sur les tuiles et en thème clair.
- **Clavier** : tout le jeu est faisable au clavier, y compris la réorganisation de Timeline par les boutons de chaque carte. Focus toujours visible (contour de 3 px, jaune en sombre, violet en clair).
- **Lecteurs d'écran** : chaque tuile a un libellé complet, par exemple « Took office: 1979, target is later » ou « Age at start: 53, close, target is younger ». Le compteur d'essais et les messages du champ sont annoncés (`aria-live`, `role="status"`).
- **À faire, absent du prototype** : piège du focus dans les fenêtres, fermeture par Échap, retour du focus sur le bouton d'origine, annonce du résultat d'une validation de Timeline.

## 12. Cas limites à traiter

- **Nom très long** : passe sur deux lignes dans la ligne d'essai, la suggestion et les cartes de Timeline.
- **Homonymes** : distingués par le pays et le mandat dans les suggestions.
- **Changement de jour pendant une partie** : la partie en cours reste celle du jour où elle a commencé. Proposer le nouveau puzzle au prochain chargement.
- **Fuseaux horaires et horloge modifiée** : le puzzle dépend de la date locale. Décider si une triche par changement d'horloge est acceptable (elle l'est dans Wordle).
- **Stockage indisponible** (navigation privée) : le jeu doit fonctionner sans, en gardant l'état en mémoire.
- **Hors ligne** : les parties déjà commencées restent jouables si les données du jour sont chargées. Sinon, écran `err-offline`.
- **Données du jour indisponibles** : écran `err-data`.
- **Chargement** : aucun état de chargement n'est dessiné. Le jeu doit s'afficher d'un coup, les emplacements publicitaires ayant leur taille réservée.

## 13. Ce qui reste à faire

Par ordre d'importance.

1. **Base de dirigeants.** Le prototype n'en a que 17 (`donnees/leaders.json`). Les cinq premiers ont été vérifiés dans le brief. **Les douze autres, marqués `verified: false`, ont été ajoutés de mémoire et doivent être contrôlés avant toute mise en ligne.** Le vrai jeu a besoin d'une base complète et sourcée : nom, variantes, pays, continent, fonction, première prise de fonction, durée cumulée, âge, drapeau, phrase de contexte neutre, lien Wikipedia, et un indicateur « peut être une réponse ».
2. **Calendrier des puzzles.** Un puzzle par jour et par mode, numéroté, avec une réponse différente dans chaque mode. Le prototype rejoue toujours le n° 128 avec Angela Merkel.
3. **Page Privacy et signalement.** Trois champs à compléter par le propriétaire du site : `[AD PARTNER]`, `[COOKIE LIST]`, `[CONTACT EMAIL]`. Le formulaire « Report an error » n'envoie rien.
4. **Régie publicitaire et consentement.** Intégration réelle de la régie et de l'outil de consentement. Le bandeau du prototype n'enregistre que le choix.
5. **Glisser tactile dans Timeline**, et les points d'accessibilité listés en section 11.
6. **Dates dans Succession.** Le prototype affiche « until 2005 » et « from 2021 » pour le prédécesseur et le successeur, déduits du mandat de la réponse. Avec une vraie base, afficher les dates complètes de chacun.
7. **Mandat dans les suggestions.** Le prototype affiche « from 1979, 11 years in office ». Avec une vraie base, afficher les années de début et de fin.
8. **Archive et quatrième mode** : prévus pour plus tard, hors périmètre du lancement.

## 14. Ordre de travail conseillé

1. Lire le brief d'origine, puis ce document, puis jouer au prototype sur bureau et sur téléphone.
2. Mettre en place les jetons de design et les composants de base : tuile, ligne d'essai, champ avec suggestions, boutons, cartes, fenêtre.
3. Construire Classic de bout en bout avec les 17 dirigeants, sauvegarde locale comprise.
4. Ajouter l'accueil, les statistiques, les réglages, le partage.
5. Ajouter Succession, Timeline et la synthèse du jour.
6. Brancher la vraie base de dirigeants et le calendrier des puzzles.
7. Terminer par les pages, le consentement, la publicité, les écrans d'erreur, puis une passe d'accessibilité.

Comparer chaque écran aux captures du dossier `captures/` avant de le considérer comme terminé.
