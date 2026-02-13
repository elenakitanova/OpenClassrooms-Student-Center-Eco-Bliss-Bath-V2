# Eco Bliss Bath — Campagne de tests automatisés (Cypress)

## Contexte
Ce dépôt contient une campagne de **tests automatisés** réalisée avec **Cypress** pour l’application e-commerce **Eco Bliss Bath**.

Cette campagne fait suite à une première campagne de tests manuels et vise à :
- automatiser les tests critiques,
- vérifier la stabilité fonctionnelle,
- apporter un niveau de confiance avant mise en production.

La couverture inclut :
- Smoke tests UI
- Tests fonctionnels UI (Connexion, Panier / Checkout)
- Tests API
- Tests de sécurité XSS (espace avis/commentaires)

---

## Prérequis
- Node.js (LTS recommandé)
- npm
- Docker & Docker Compose
- Application Eco Bliss Bath lancée en local :
  - Frontend : http://localhost:4200
  - API : http://localhost:8081

---

## Installation
Se placer dans le dossier du projet (déjà cloné) :
cd OpenClassrooms-Student-Center-Eco-Bliss-Bath-V2

Installer les dépendances :
npm install

Se positionner sur la branche des tests : git checkout elena/qa-tests

---

## Lancer les tests

avec : docker, npm run, cypress open, cypress run

Commande : npx cypress open
Permet :
- d’exécuter les tests individuellement,
- de visualiser les scénarios,
- de déboguer plus facilement.

Commande mode campagne complète : npx cypress run
Exécute :
- tous les tests UI,
- tous les tests API,
- l’ensemble de la campagne automatisée.

---

## Reset automatique de la base de donnée 
Avant l’exécution complète de la campagne, Cypress déclenche automatiquement :
docker compose down -v && docker compose up -d
Cela permet :
- de repartir d’une base propre,
- d’éviter les effets de bord,
- de garantir des tests reproductibles.

---

## Stratégie d’automatisation
La stratégie d’automatisation repose sur :
- Une séparation claire entre tests UI et tests API
- Une centralisation des variables d’environnement
- Un reset automatique de la base pour garantir la reproductibilité
- Une couverture des scénarios métier critiques
- Une traçabilité des anomalies identifiées lors des tests manuels

Cette approche permet :
- Une exécution rapide et fiable
- Une maintenance facilitée
- Une meilleure robustesse avant mise en production

---

## Tests automatisés inclus
1. Smoke tests UI
- Vérification du chargement de l’application
- Vérification des éléments critiques de la page d’accueil
- Vérification du bon fonctionnement de la connexion
Objectif : détecter rapidement toute régression bloquante.

2. Tests fonctionnels UI
- Connexion utilisateur (succès / échec)
- Ajout produit au panier
- Modification quantité
- Suppression produit
- Validation commande
- Test XSS sur les avis
Objectif : sécuriser les parcours métier critiques.

3. Tests API
- Authentification
POST /login (connexion réussie)
POST /login (échec 401)
POST /register (création compte)
POST /register (email déjà existant)
POST /register (mots de passe différents)
GET /me (profil utilisateur connecté)

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
Certains tests ont été ajoutés spécifiquement pour vérifier les écarts relevés lors de la campagne manuelle :
- Vérification de la conformité REST sur /orders/add
- Vérification du code attendu 403 vs 401 sur accès non authentifié
- Vérification du comportement lors d’un ajout panier en rupture de stock

Ces tests permettent :
- d’identifier clairement les écarts
- de tracer les anomalies
- de ne pas masquer les problèmes côté backend

---

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
Elles sont accessibles dans les tests via :
Cypress.env('nomDeVariable')

Objectif :
- Centraliser la configuration
- Éviter les données sensibles en dur
- Faciliter la maintenance

---

## Documentation de test
[Consulter la documentation technique des tests](Docs/README-technique.md)






