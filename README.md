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

Cloner le dépôt :
```bash
git clone <url-du-repo>
cd <nom-du-projet>



## Documentation de test

📄 [Consulter la documentation technique des tests](Docs/README-technique.md)

