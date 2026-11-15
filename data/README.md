# Données des dirigeants : relecture avant la mise en ligne

La base est construite automatiquement depuis Wikidata (licence CC0), puis corrigée à la main dans `overrides.json`. **Rien n'a encore été relu par un humain.** Les étapes ci-dessous sont à faire avant d'ouvrir le site.

## Ce que fait la construction

- **Qui est dans le jeu** : les titulaires des fonctions nationales de chef d'État ou de gouvernement depuis 1900. Elles viennent de deux sources :
  - les fonctions déclarées par les États (P1906, P1313) ;
  - les sous-classes de chef d'État, chef de gouvernement, monarque, président ou Premier ministre dont la juridiction (P1001) est un État, ce qui couvre par exemple « Prime Minister of the Kingdom of Italy » ou « King of Sweden ».
- **Titres génériques** (« prime minister », « president »…) : jamais rattachés à un pays. C'est ce qui rattachait Mussolini à l'Inde.
- **Fonction partagée entre plusieurs États** (« Chancellor of Germany ») : chaque mandat va à l'État qui existait à sa date.
- **Ce qui est retiré** :
  - les villes ;
  - les gouverneurs généraux et les titres ex officio (coprinces d'Andorre) ;
  - les mandats marqués « acting » ou « interim » ;
  - les mandats terminés avant 1900 ;
  - les fonctions de parti (secrétaires généraux), les intérims, les consorts, les prétendants et les fonctions régionales ;
  - les républiques fédérées soviétiques et les entités non reconnues ou non souveraines (voir `excludeCountries`).
- **Nom affiché** : le titre de l'article Wikipedia anglais, plus fiable que l'étiquette Wikidata (« Kuan Yew Lee » sur Wikidata, « Lee Kuan Yew » sur Wikipedia).
- **Took office** : première prise de fonction.
- **Years in office** : total des mandats, arrondi à l'année inférieure, recalculé chaque jour pour un dirigeant en poste.
- **Age at start** : âge au jour de la première prise de fonction.
- **Role** :
  - « Both » si la fonction cumule les deux rôles, ou si la personne a tenu les deux en même temps pendant au moins la moitié de son temps au pouvoir ;
  - sinon le rôle exercé le plus longtemps, signalé pour relecture.
- **Pays** : celui de la fonction exercée le plus longtemps. Les anciens États peuvent être fusionnés avec le pays actuel.
- **Liste des noms proposables** : au moins 25 liens interwikis (2 729 dirigeants).
- **Réponses possibles** : au moins 90 liens interwikis (319 dirigeants), proposition à valider.

## À relire

1. **`review.csv`, colonne `flags`** : une ligne par cas douteux.
   - `held state and government offices` : choisir le bon rôle dans `roles`.
   - `several countries` : choisir le pays dans `countries`.
   - `open term after death` : vérifier la date de fin.
   - `odd age` : rois montés sur le trône enfants. C'est en général exact.
   - `term outside country dates` : le mandat tombe hors des dates de l'État sur Wikidata. Le plus souvent, l'État moderne a une date de création récente (Japon, Royaume-Uni, Iran) et le dirigeant est légitime. Reste quelques dirigeants de républiques fédérées yougoslaves d'avant 1991, à exclure au cas par cas.
2. **Les réponses possibles** (`answerable=true` dans `review.csv`). Ce doivent être des dirigeants connus du grand public (PASSATION §5). Retirer ou ajouter avec `answerable.remove` et `answerable.add`.
3. **Les choix sensibles déjà faits dans `overrides.json`, à confirmer** :
   - Exclus comme non reconnus ou non nationaux : républiques populaires de Donetsk et de Louhansk, Artsakh, Krajina serbe, Republika Srpska, Bavière, Bade, gouvernement de Canton, Médie-Perse.
   - Empire allemand, République de Weimar et Reich allemand fusionnés dans « Germany », **sans drapeau**. Aucun drapeau historique n'est jamais affiché, seuls les drapeaux ISO actuels existent dans le jeu.
   - Continents des pays à cheval sur deux continents : Russie et URSS en Europe, Turquie et Kazakhstan en Asie.
   - Régimes successifs regroupés sous le nom actuel (Royaume d'Italie → Italy, Zaïre → Democratic Republic of the Congo, Union sud-africaine → South Africa…). Le drapeau n'est gardé que s'il n'a pas changé.
   - Tchang Kaï-chek rattaché à « Republic of China ». Les présidents d'après 1949 restent sous « Taiwan », le nom que donne Wikidata.
   - Corrigés à la main (`terms`, `blurbs`) : Pinochet depuis 1973, Salman roi depuis 2015.
   - Retirés des réponses : Goebbels (chancelier un jour), Van Rompuy, et les papes d'avant l'État du Vatican (1929) ou au pontificat très bref.
4. **Un échantillon de fiches au hasard**, comparées à Wikipedia : dates, âge, pays, fonction.

Après chaque correction : `npm run data:leaders`, puis `npm run check:data`.

## Calendrier

- `data/schedule.json` est le calendrier publié. Le script ne fait qu'ajouter des jours à la fin : un jour publié ne change jamais, même si la base évolue.
- Pour imposer une réponse un jour donné : `data/schedule-forced.json`, par exemple `{ "42": { "classic": "Q567" } }`. Le champ `succession` attend l'id de la réponse, `timeline` cinq ids.
- Si une réponse publiée devient non valide (dirigeant retiré de la base), `check:data` fait échouer le build. Il faut alors corriger le jour à la main dans `schedule.json`.
- Une chaîne Succession n'est retenue que si les trois mandats se suivent sans trou ni chevauchement, et sans autre titulaire de la fonction pendant cette période (gouvernement en exil, présidence collective). La fonction doit être celle du pays de la réponse.
- Règles :
  - Classic : pas de réponse répétée avant 240 jours.
  - Succession : pas de réponse répétée avant 150 jours.
  - Timeline : une carte ne revient pas avant 14 jours.
  - Le même jour, aucun dirigeant n'apparaît dans deux modes.

Tant que la date de lancement n'est pas fixée, le calendrier compte 800 jours à partir du n° 1. Si la base change avant le lancement, on peut supprimer `schedule.json` et régénérer.
