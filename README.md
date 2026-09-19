# TP NoSQL — Bibliothèque (MongoDB)

## Sommaire

- [Stack](#stack)
- [Structure du dépôt](#structure-du-dépôt)
- [Démarrage rapide](#démarrage-rapide)
- [Modèle de données](#modèle-de-données)
- [Jeu de données](#jeu-de-données)
- [Exercices couverts](#exercices-couverts)
- [Commandes utiles](#commandes-utiles)
- [Dépannage](#dépannage)

---

## Stack

| Outil | Version | Rôle |
|---|---|---|
| MongoDB | 7.0 | Base de données |
| mongosh | 2.x | Shell et exécution des scripts |
| Docker Compose | v2 | Environnement local |
| mongo-express | latest | Interface web (optionnelle) |

---

## Structure du dépôt

```
.
├── docker-compose.yml           # MongoDB + mongo-express
├── bibliotheque_collections.js  # Création des collections + validation $jsonSchema + index
├── insertion_donnees.js         # Jeu de données (auteurs, livres, utilisateurs, emprunts)
├── requetes.js                  # Requêtes des exercices
└── README.md
```

---

## Démarrage rapide

### 1. Lancer la base

```bash
docker compose up -d
docker ps        # le conteneur doit être "Up"
```

### 2. Créer les collections et insérer les données

```bash
docker exec -it mongodb_bibliotheque mongosh \
  "mongodb://root:root123@localhost:27017/bibliotheque?authSource=admin" \
  /scripts/bibliotheque_collections.js

docker exec -it mongodb_bibliotheque mongosh \
  "mongodb://root:root123@localhost:27017/bibliotheque?authSource=admin" \
  /scripts/insertion_donnees.js
```

Le dossier courant est monté dans `/scripts` grâce au volume `./:/scripts`.

### 3. Vérifier

Le second script affiche un récapitulatif :

```
auteurs       12
livres        20
utilisateurs  10
emprunts      22

Références invalides (doit être 0)
livres.auteur_id         : 0
emprunts.livre_id        : 0
emprunts.utilisateur_id  : 0
```

### 4. Explorer

Depuis le shell :

```bash
docker exec -it mongodb_bibliotheque mongosh \
  "mongodb://root:root123@localhost:27017/bibliotheque?authSource=admin"
```

```js
show collections
db.livres.findOne({ titre: "1984" })
load("/scripts/requetes.js")
```

Ou via l'interface web **mongo-express** : <http://localhost:8080>

> MongoDB ne parle pas HTTP : ouvrir `http://localhost:27017` dans un navigateur
> affiche un message d'avertissement, c'est normal.

---

## Modèle de données

Les collections sont liées par **références** (`ObjectId`), pas par imbrication.

```
auteurs ──< livres ──< emprunts >── utilisateurs
```

### `auteurs`

| Champ | Type | Description |
|---|---|---|
| `_id` | ObjectId | Identifiant |
| `nom` | String | Nom complet |
| `nationalite` | String | Pays d'origine |
| `annee_naissance` | Number | Année de naissance |
| `annee_deces` | Number | Absent si l'auteur est vivant |
| `biographie` | String | Brève biographie |
| `livres_ecrits` | Number | Nombre total de livres écrits |

### `livres`

| Champ | Type | Description |
|---|---|---|
| `_id` | ObjectId | Identifiant |
| `titre` | String | Titre |
| `auteur_id` | ObjectId | Référence → `auteurs._id` |
| `annee_publication` | Number | Année de publication |
| `genre` | String | Genre littéraire |
| `nombre_pages` | Number | Nombre de pages |
| `langue` | String | Langue |
| `editeur` | String | Maison d'édition |
| `disponible` | Boolean | Disponibilité pour emprunt |
| `note_moyenne` | Number | Note sur 5 |
| `date_ajout` | Date | Date d'ajout |
| `tags` | Array | Mots-clés |

### `utilisateurs`

| Champ | Type | Description |
|---|---|---|
| `_id` | ObjectId | Identifiant |
| `nom` | String | Nom complet |
| `email` | String | Email (index unique) |
| `type` | String | `Étudiant`, `Professeur` ou `Membre` |
| `date_inscription` | Date | Date d'inscription |
| `nombre_emprunts` | Number | Total historique |
| `abonnements` | Array | Types d'abonnements |

### `emprunts`

| Champ | Type | Description |
|---|---|---|
| `_id` | ObjectId | Identifiant |
| `livre_id` | ObjectId | Référence → `livres._id` |
| `utilisateur_id` | ObjectId | Référence → `utilisateurs._id` |
| `date_emprunt` | Date | Début de l'emprunt |
| `date_retour_prevue` | Date | Retour prévu |
| `date_retour_reelle` | Date \| null | `null` si non retourné |
| `statut` | String | `en_cours`, `retourne`, `retard`, `annule` |
| `amende` | Number | Montant de l'amende |

### Validation

Chaque collection est créée avec un validateur **`$jsonSchema`** qui impose les types,
les champs obligatoires et quelques règles métier :

- `note_moyenne` entre 0 et 5 ;
- `type` et `statut` restreints à leurs valeurs autorisées (`enum`) ;
- format d'email vérifié par expression régulière.

### Index

```js
db.utilisateurs.createIndex({ email: 1 }, { unique: true })
db.livres.createIndex({ auteur_id: 1 })
db.emprunts.createIndex({ utilisateur_id: 1 })
db.emprunts.createIndex({ livre_id: 1 })
db.emprunts.createIndex({ statut: 1, date_retour_prevue: 1 })
```

---

## Jeu de données

12 auteurs · 20 livres · 10 utilisateurs · 22 emprunts

Les données sont volontairement variées pour que les requêtes donnent des résultats
exploitables :

- 11 genres, 4 langues, publications de 1831 à 2013 ;
- livres de 96 à 1900 pages, notes de 3.8 à 4.9 ;
- les 4 statuts d'emprunt représentés, dont 2 retours tardifs avec amende ;
- 2 auteurs vivants (sans `annee_deces`).

**Cohérence garantie :** tous les `ObjectId` de référence pointent vers un document
existant, et un livre a `disponible: false` si et seulement s'il a un emprunt
`en_cours` ou `retard`.

Les identifiants sont fixes, ce qui rend les scripts rejouables :

| Collection | Préfixe des `_id` |
|---|---|
| `auteurs` | `65f1…` |
| `livres` | `66a0…` |
| `utilisateurs` | `67b0…` |

> `insertion_donnees.js` commence par un `deleteMany({})` sur les 4 collections :
> le script est **idempotent** et peut être relancé sans erreur de clé dupliquée.

---

## Exercices couverts

| # | Thème | Opérateurs principaux |
|---|---|---|
| 1 | Création des collections | `createCollection`, `$jsonSchema` |
| 2 | Insertion des données | `insertOne`, `insertMany` |
| 3 | Requêtes de lecture | `find`, `$gt`, `$in`, `$regex`, `sort`, `limit` |
| 4 | Mises à jour | `updateOne`, `updateMany`, `$set`, `$addToSet`, `$expr` |
| 5 | Suppressions | `deleteMany`, `$nin`, `distinct` |
| 6 | Jointures | `$lookup`, `$unwind`, `$first`, `$size` |
| 7 | Agrégations avancées | `$group`, `$avg`, `$sum`, `$dateDiff`, `$filter`, `$map` |

---

## Commandes utiles

```bash
docker compose up -d           # démarrer
docker compose down            # arrêter (données conservées)
docker compose down -v         # arrêter et EFFACER le volume
docker compose logs -f         # suivre les logs
docker compose config          # valider le docker-compose.yml
```

```js
show dbs                       // lister les bases
use bibliotheque
show collections
db.livres.countDocuments()
load("/scripts/insertion_donnees.js")
```

---

## Dépannage

| Message | Cause | Solution |
|---|---|---|
| `Authentication failed` | Identifiants changés après le 1er démarrage : `MONGO_INITDB_*` n'agit que sur un volume vide | `docker compose down -v && docker compose up -d` |
| `E11000 duplicate key` | Insertion relancée sans vider la collection | Relancer le script entier avec `load()` (il contient le `deleteMany`) |
| `Document failed validation` | Le document ne respecte pas le `$jsonSchema` | Lire `schemaRulesNotSatisfied` dans l'erreur |
| `port is already allocated` | Port hôte déjà pris | Changer le port **de gauche** dans `ports:` |
| `Cannot read properties of null` | `findOne` n'a rien trouvé, la variable vaut `null` | Vérifier le filtre, ou réassigner la variable sans `const` |
| Page blanche sur `:8080` | mongo-express écoute sur **8081** dans le conteneur | Mapper `"8080:8081"` |

---

## Licence

Projet académique — usage pédagogique.
