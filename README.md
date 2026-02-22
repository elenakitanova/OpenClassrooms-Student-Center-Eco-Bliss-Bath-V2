# Eco Bliss Bath — Campagne de tests automatisés (Cypress)
## Contexte

1. Ce dépôt contient une campagne de tests automatisés réalisée avec Cypress pour l’application e-commerce Eco Bliss Bath.

2. Cette campagne fait suite à une première campagne de tests manuels et vise à :
- automatiser les tests critiques,
- vérifier la stabilité fonctionnelle,
- sécuriser les parcours générateurs de chiffre d’affaires,
- détecter les anomalies backend,
- apporter un niveau de confiance avant mise en production.

3. La couverture inclut :
- Smoke tests UI
- Tests fonctionnels UI (Connexion, Panier / Checkout)
- Tests API
- Tests de sécurité XSS (espace avis/commentaires)
- Tests métier avancés sur la gestion des stocks

4. En complément du périmètre obligatoire, certains tests supplémentaires ont été ajoutés (notamment autour de l’inscription, des cas limites et de la robustesse API) afin d’illustrer les recommandations formulées dans le bilan et d’enrichir la couverture fonctionnelle.

5. Dernière exécution :
- 50 tests exécutés
- 46 tests réussis
- 4 tests en échec (uniquement API)
- 1 spec en échec (api_tests.cy.js)
- Les parcours UI critiques sont validés à 100 %.

## Prérequis
- Node.js (LTS recommandé)
- npm
- Docker & Docker Compose

Application Eco Bliss Bath lancée en local :
- Frontend : http://localhost:4200
- API : http://localhost:8081

## Installation
1. Se placer dans le dossier du projet (déjà cloné) :
cd OpenClassrooms-Student-Center-Eco-Bliss-Bath-V2

2. Se positionner sur la branche des tests : git checkout elena/qa-tests

3. Pour démarrer l'API avec sa base de données : docker compose up -d

4. Pour démarrer le frontend de l'applicatif : 
- cd ./frontend/frontend
- npm install
- npm start

5. Installer les dépendances si nécessaire :
- npm install
- Vérifier que l’API répond : http://localhost:8081/api/health
- Vérifier que le frontend est accessible : http://localhost:4200

## Lancer les tests
1. Mode interactif (debug)
Commande : npx cypress open

Permet :
- d’exécuter les tests individuellement,
- de visualiser les scénarios,
- de déboguer plus facilement.

Important :
npx cypress open ne déclenche pas l’évènement before:run.

Pour garantir une base propre même en mode interactif, un reset est exécuté au lancement de chaque spec via before:spec.

2. Mode campagne complète (CI)
Commande : npx cypress run

Exécute :
- tous les tests UI,
- tous les tests API,
- l’ensemble de la campagne automatisée.

Important :
npx cypress run déclenche automatiquement l’évènement before:run.
Cela provoque un reset complet de la base avant le début de la campagne.
Le reset par spec garantit également l’isolation entre les différents fichiers de test.

## Rapport des tests
1. En mode interactif : npx cypress open
Les résultats sont visibles dans l’interface Cypress.

2. En mode run : npx cypress run
Les résultats sont affichés dans le terminal.

3. En cas d’échec
Les screenshots sont disponibles dans : cypress/screenshots

# Reset automatique de la base de donnée
1. Le reset s’appuie sur Docker et sur un bind mount local ./mysql.

2. Le mécanisme exécuté par Cypress :
- arrêt des conteneurs : docker compose down
- suppression de la base persistée localement : rm -rf ./mysql && mkdir ./mysql
- redémarrage des conteneurs : docker compose up -d
- attente active de la disponibilité de l’API via /api/health

3. Ce mécanisme garantit :
- un état de base propre,
- l’élimination des effets de bord entre exécutions,
- des tests reproductibles,
- une exécution fiable en soutenance et en intégration continue.

## Stratégie d’automatisation
La stratégie d’automatisation repose sur :
- Une séparation claire entre tests UI et tests API.
- Une centralisation des variables d’environnement.
- Un reset automatique de la base pour garantir la reproductibilité.
- Une couverture des scénarios métier critiques.
- Une traçabilité des anomalies identifiées lors des tests manuels.

En complément du périmètre minimal requis, certains scénarios recommandés dans le bilan de test ont également été automatisés afin de démontrer une démarche qualité proactive.

Distinction importante :
- Tests bloquants métier : connexion, panier, checkout, gestion des stocks.
- Tests contractuels / informatifs : conformité REST, codes HTTP, healthcheck.

Cette approche permet :
- Une exécution rapide et fiable.
- Une maintenance facilitée.
- Une meilleure robustesse avant mise en production.

Les tests automatisés inclus
1. Smoke tests UI
- vérification du chargement de l’application,
- vérification des éléments critiques de la page d’accueil,
- vérification du bon fonctionnement de la connexion,
- vérification de l’accès aux fiches produits,
- présence du bouton “Ajouter au panier”.

Objectif : détecter rapidement toute régression bloquante.

2. Tests fonctionnels UI
- connexion utilisateur (succès / échec),
- validation formulaire (champs vides),
- persistance de session,
- ajout produit au panier,
- modification quantité,
- suppression produit,
- validation commande,
- gestion des quantités invalides (0, négatif, décimal),
- fusion des lignes panier,
- accès direct /cart sans authentification,
- persistance panier après refresh,
- vérification décrémentation du stock,
- affichage disponibilité produit.

Objectif : sécuriser les parcours métier critiques.

3. Tests API
- Authentification
POST /login (connexion réussie)
POST /login (échec 401)
GET /me

- Inscription (tests supplémentaires – non obligatoires)
POST /register (création de compte valide)
POST /register (email déjà existant)
POST /register (mots de passe différents)

- Produits
GET /products
GET /products/random
GET /products/{id}
GET /products/{id} inexistant (404)

- Panier & Commandes
PUT /orders/add
GET /orders
PUT /orders/{id}/change-quantity
DELETE /orders/{id}/delete
POST /orders (validation commande)

- Avis
GET /reviews
POST /reviews

- Sécurité
Accès à /orders sans authentification (401)

4. Tests liés aux anomalies identifiées
Certains tests ont été ajoutés spécifiquement pour vérifier les écarts relevés lors de la campagne manuelle.

Ces tests sont volontairement rouges lorsque le comportement backend ne correspond pas au contrat attendu.

- Non-conformités techniques
NC-1 : /orders sans token
Attendu : 403
Observé : 401

- NC-2 : conformité REST sur /orders/add
Attendu : POST
Observé : 405 (endpoint implémenté en PUT)

Ces non-conformités sont techniques et n’impactent pas directement le parcours utilisateur.

5. Tests métier — Gestion des stocks
Deux tests API démontrent une anomalie métier backend :

- Ajout produit en rupture de stock
Attendu : 400 ou 422
Observé : 200

- Ajout quantité supérieure au stock disponible
Attendu : 400 ou 422
Observé : 200

Pourquoi c’est une preuve de bug métier :
- Le stock réel est récupéré via l’API.
- Le test vérifie que le produit est bien à 0 ou inférieur à la quantité demandée.
- L’appel officiel à l’endpoint est exécuté.
- Le serveur retourne 200 (acceptation).
- Le backend accepte donc un état invalide métier.
- Il ne s’agit pas d’un problème de test ni d’un problème UI.

Impact possible :
- survente,
- commandes impossibles,
- incohérence inventaire,
- litiges clients.

Ces tests sont considérés comme bloquants métier.

6. Test XSS sur les avis
Objectif : vérifier que les scripts injectés dans les commentaires ne sont pas exécutés côté frontend.

Vérifications :
- non-exécution du script,
- neutralisation du payload.

Résultat : conforme.

## Anomalies détectées lors de la campagne
- 2 non-conformités techniques (mineures)
- 2 anomalies métier backend (majeures)
| ID     | Type                  | Gravité  | Statut  |
|--------|-----------------------|----------|---------|
| NC-1   | Code HTTP incorrect   | Mineure  | Ouverte |
| NC-2   | Non conformité REST   | Mineure  | Ouverte |
| ANO-03 | Bug métier stock      | Majeure  | Ouverte |
| ANO-04 | Bug métier stock      | Majeure  | Ouverte |

## Variables d’environnement
Les variables sont définies dans cypress.config.js :

env: {
  apiUrl: 'http://localhost:8081',
  userEmail: 'test2@test.fr',
  userPassword: 'testtest',
  registerFirstName: 'Elena',
  registerLastName: 'Kitanova',
  registerPassword: 'Ecobliss4'
}

Elles sont accessibles dans tous les fichiers de tests Cypress
(cypress/e2e/*.cy.js) via : Cypress.env('nomDeVariable')

Objectif :
- centraliser la configuration,
- éviter les données sensibles en dur,
- faciliter la maintenance,
- documentation de test.

## Documentation technique détaillée
La documentation technique complète est disponible ici :
[Consulter le README technique](Docs/README-technique.md)

