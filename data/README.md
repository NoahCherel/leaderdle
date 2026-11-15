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
2. **Les réponses possibles** (`answerable=true` dans `review.csv`). Ce doivent être des dirigeants connus du grand public (PASSATION §5). Le seuil automatique (90 liens Wikipedia) en laissait 326 ; 149 ont été retirés à la main dans `answerable.remove` (Kaja Kallas, Thomas Sankara, présidents honorifiques, monarques peu connus hors de leur pays…). Il en reste 177. Ce tri est un jugement : remettre un nom se fait en le retirant de `answerable.remove`.
   Cas limites, à trancher par le propriétaire :
   - *Retirés malgré beaucoup de liens Wikipedia* : Rafael Correa (173) et Guillermo Lasso (161), dont le score est gonflé ; les présidents américains du début du XXe siècle (Coolidge, Taft, McKinley, Harding) ; Bhumibol Adulyadej ; Sukarno ; les papes Paul VI, Pie XI et Pie XII ; Rouhani, Porochenko, Ianoukovytch, Saakachvili.
   - *Gardés malgré peu de liens* (90 à 100) : Senghor, Mobutu, de Klerk, Salazar, Perón, Pétain, Honecker, Léopold II, Olof Palme, Albert II de Monaco, George Weah, Kagame, Draghi, Mark Carney, Milei.
   - *Remis après une seconde lecture* : Hu Jintao, Suharto, Akihito, Cristina Kirchner, Musharraf, Mahathir Mohamad, Jean XXIII.
3. **Les noms du jeu Letters** : `data/letters.json` associe un dirigeant au nom à épeler (144 noms). C'est le nom d'usage, en capitales sans accents, 11 lettres au plus : `MERKEL`, `DE GAULLE`, `XI JINPING`. Un dirigeant absent de ce fichier n'est jamais tiré dans Letters : c'est voulu pour les papes, les monarques numérotés, les noms de 3 lettres et les translittérations qui varient (Zelenskyy). `check:data` vérifie que chaque nom figure bien dans le nom affiché du dirigeant.
4. **Les choix sensibles déjà faits dans `overrides.json`, à confirmer** :
   - Exclus comme non reconnus ou non nationaux : républiques populaires de Donetsk et de Louhansk, Artsakh, Krajina serbe, Republika Srpska, Bavière, Bade, gouvernement de Canton, Médie-Perse.
   - Empire allemand, République de Weimar et Reich allemand fusionnés dans « Germany », **sans drapeau**. Aucun drapeau historique n'est jamais affiché, seuls les drapeaux ISO actuels existent dans le jeu.
   - Continents des pays à cheval sur deux continents : Russie et URSS en Europe, Turquie et Kazakhstan en Asie.
   - Régimes successifs regroupés sous le nom actuel (Royaume d'Italie → Italy, Zaïre → Democratic Republic of the Congo, Union sud-africaine → South Africa…). Le drapeau n'est gardé que s'il n'a pas changé.
   - Tchang Kaï-chek rattaché à « Republic of China ». Les présidents d'après 1949 restent sous « Taiwan », le nom que donne Wikidata.
   - Corrigés à la main (`terms`, `blurbs`) : Pinochet depuis 1973, Salman roi depuis 2015.
   - Retirés des réponses : Goebbels (chancelier un jour), Van Rompuy, et les papes d'avant l'État du Vatican (1929) ou au pontificat très bref.
5. **Un échantillon de fiches au hasard**, comparées à Wikipedia : dates, âge, pays, fonction.

Après chaque correction : `npm run data:leaders`, puis `npm run check:data`.

## Calendrier

- `data/schedule.json` est le calendrier publié. Le script ne fait qu'ajouter des jours à la fin : un jour publié ne change jamais, même si la base évolue.
- Pour imposer une réponse un jour donné : `data/schedule-forced.json`, par exemple `{ "42": { "classic": "Q567" } }`. Les champs `letters` et `succession` attendent l'id de la réponse, `timeline` cinq ids.
- Si une réponse publiée devient non valide (dirigeant retiré de la base), `check:data` fait échouer le build. Il faut alors corriger le jour à la main dans `schedule.json`.
- Une chaîne Succession n'est retenue que si les trois mandats se suivent sans trou ni chevauchement, et sans autre titulaire de la fonction pendant cette période (gouvernement en exil, présidence collective). La fonction doit être celle du pays de la réponse.
- Règles :
  - Classic : pas de réponse répétée avant 120 jours.
  - Letters : pas de réponse répétée avant 90 jours.
  - Succession : pas de réponse répétée avant 60 jours (92 réponses possibles seulement).
  - Une réponse de Classic, Letters ou Succession ne sert pas de réponse à un autre jeu pendant 14 jours.
  - Timeline : une carte ne revient pas avant 14 jours.
  - Le même jour, aucun dirigeant n'apparaît dans deux modes.

Tant que la date de lancement n'est pas fixée, le calendrier compte 800 jours à partir du n° 1. Si la base change avant le lancement, on peut supprimer `schedule.json` et régénérer.

## Leader Mayhem

- **`mayhem-ratings.csv`** : les notes du mode bonus, **privées** : le jeu ne les montre jamais, seuls les résultats des duels en découlent. 436 dirigeants notés. Une ligne par dirigeant, une note de 1 à 10 par portefeuille (`education`, `war`, `economy`, `domestic`, `foreign`) et une justification courte (`why`).
- **Barème** : la note mesure le poids et l'efficacité du dirigeant dans ce domaine, quels que soient ses buts. Ce n'est ni un fait ni un jugement moral, et le jeu le dit. Aucun dirigeant n'est exclu. `education` couvre aussi la science et la culture.
- **Écart voulu** : un ou deux points forts à 8-10, des faiblesses à 1-3. Les chefs d'État honorifiques (présidents allemands ou italiens, monarques constitutionnels) sont bas partout : ce sont les pièges des tirages. Pour les papes, `domestic` est le gouvernement de l'Église et `foreign` la diplomatie.
- Pour ajouter des notes par nom : un fichier de lignes `Nom|e w ec d f|raison`, puis `node scripts/mayhem/add.ts fichier`.
- **`mayhem-pool.csv`** : les dirigeants à noter (les réponses possibles, plus les dirigeants à 60 liens Wikipedia ou plus des 20 pays les mieux fournis), avec une colonne `rated`. `npm run mayhem:pool` le régénère.
- Après chaque modification : `npm run mayhem:build` (écrit `public/data/mayhem.json` et affiche le nombre de tirages jouables), `npm run mayhem:balance` si beaucoup de notes ont bougé, puis `npm run check:data`.
- Un tirage pays-décennie n'est jouable qu'avec au moins deux dirigeants notés. Il en faut environ 150 pour que les parties varient ; `check:data` prévient en dessous.
