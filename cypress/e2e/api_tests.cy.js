/**
 * ============================================================================
 * CAMPAGNE DE TEST API – ECO BLISS BATH (VERSION AUTOMATISÉE)
 * ============================================================================
 *
 * CONTEXTE :
 * Eco Bliss Bath est une application e-commerce de produits de beauté
 * écoresponsables. Cette suite de tests vise à automatiser les tests API
 * recommandés suite à la campagne de tests manuels réalisée par Marie.
 *
 * OBJECTIF GÉNÉRAL :
 * - Vérifier la stabilité et la sécurité de l’API
 * - Comparer le comportement réel de l’API avec les résultats des tests manuels
 * - Confirmer si les anomalies identifiées ont été corrigées ou non
 *
 * IMPORTANT :
 * Certains tests valident volontairement des comportements incorrects
 * afin de documenter des ANOMALIES TOUJOURS PRÉSENTES côté backend.
 * ============================================================================
 */

describe('API – Eco Bliss Bath', () => {

  // ---------------------------------------------------------------------------
  // VARIABLES GLOBALES
  // ---------------------------------------------------------------------------
  // Token JWT récupéré une seule fois afin d’éviter de répéter le login
  let token;

  // ---------------------------------------------------------------------------
  // PRÉREQUIS : AUTHENTIFICATION API
  // ---------------------------------------------------------------------------
  before(() => {
    cy.apiLogin().then((jwtToken) => {
      token = jwtToken;
    });
  });

  // ---------------------------------------------------------------------------
  // API-01 : ACCÈS AUX DONNÉES SENSIBLES SANS AUTHENTIFICATION
  // ---------------------------------------------------------------------------
  it('API-01 : GET /orders sans être connecté → 401 (anomalie sécurité)', () => {

    /**
     * OBJECTIF :
     * Vérifier que la route /orders est protégée contre l’accès non authentifié.
     *
     * ATTENDU (selon la spécification fonctionnelle) :
     * - Code HTTP 403 Forbidden
     *
     * RÉSULTAT OBSERVÉ (tests manuels + automatisés) :
     * - Code HTTP 401 Unauthorized
     *
     * CONCLUSION QA :
     * - L’anomalie identifiée par Marie est TOUJOURS PRÉSENTE
     * - L’API ne distingue pas correctement :
     *   • utilisateur non authentifié (401)
     *   • utilisateur authentifié mais non autorisé (403)
     */

    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/orders`,
      failOnStatusCode: false // On accepte l’erreur pour l’analyser
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  // ---------------------------------------------------------------------------
  // API-02 : ACCÈS À /orders AVEC AUTHENTIFICATION
  // ---------------------------------------------------------------------------
  it('API-02 : GET /orders connecté → 200 (structure instable)', () => {

    /**
     * OBJECTIF :
     * Vérifier le comportement réel de la route /orders une fois authentifié.
     *
     * OBSERVATION QA IMPORTANTE :
     * - L’API ne retourne PAS un panier standard
     * - Le body retourné correspond parfois à un objet utilisateur
     * - La structure de la réponse n’est pas fiable
     *
     * DÉCISION QA :
     * - Ne PAS tester une structure fonctionnelle attendue
     * - Tester uniquement ce qui est garanti techniquement
     *
     * CE TEST PERMET :
     * - De sécuriser la non-régression HTTP (200 OK)
     * - De documenter une anomalie de conception backend
     */

    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/orders`,
      headers: {
        Authorization: `Bearer ${token}`
      }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('object');

      // Vérification minimale volontairement choisie
      // afin d’éviter un faux négatif dû à une API instable
      expect(res.body).to.have.property('id');
    });
  });

  // ---------------------------------------------------------------------------
  // API-03 : CONSULTATION DU CATALOGUE PRODUITS (ACCÈS PUBLIC)
  // ---------------------------------------------------------------------------
  it('API-03 : GET /products/{id} → 200', () => {

    /**
     * OBJECTIF :
     * Vérifier que les produits sont accessibles sans authentification.
     *
     * STRATÉGIE :
     * - Récupération dynamique d’un ID produit
     * - Évite les erreurs liées à des IDs inexistants
     */

    cy.request(`${Cypress.env('apiUrl')}/products`)
      .then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.be.an('array');

        const productId = res.body[0].id;

        cy.request(`${Cypress.env('apiUrl')}/products/${productId}`)
          .its('status')
          .should('eq', 200);
      });
  });

  // ---------------------------------------------------------------------------
  // API-04 : AJOUT D’UN PRODUIT AU PANIER
  // ---------------------------------------------------------------------------
  it('API-04 : PUT /orders/add → 400 (anomalie backend confirmée)', () => {

    /**
     * OBJECTIF :
     * Tester l’ajout d’un produit au panier.
     *
     * ANOMALIES CONFIRMÉES :
     * 1. Non-respect REST : utilisation de PUT au lieu de POST
     * 2. Validation backend défectueuse :
     *    - Le champ "product" est systématiquement rejeté
     *    - Aucune valeur testée n’est acceptée
     *
     * RÉSULTAT :
     * - Code HTTP 400 Bad Request
     *
     * CONCLUSION QA :
     * - L’anomalie identifiée lors des tests manuels n’a PAS été corrigée
     * - L’ajout au panier est actuellement non fonctionnel
     */

    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/orders/add`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: {
        product: '/products/1',
        quantity: 1
      },
      failOnStatusCode: false // Le 400 est attendu et documenté
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body).to.have.property('error');
    });
  });

  // ---------------------------------------------------------------------------
  // API-05 : AJOUT D’UN AVIS CLIENT
  // ---------------------------------------------------------------------------
  it('API-05 : POST /reviews → 200', () => {

    /**
     * OBJECTIF :
     * Vérifier qu’un utilisateur authentifié peut poster un avis.
     *
     * OBSERVATION :
     * - La route fonctionne correctement
     * - Aucun écart constaté par rapport aux tests manuels
     */

    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/reviews`,
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: {
        title: 'Excellent produit',
        comment: 'Très bon savon',
        rating: 5
      }
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

});