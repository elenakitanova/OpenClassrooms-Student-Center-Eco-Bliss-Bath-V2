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
 * - Vérifier la sécurité de l’API (authentification et accès aux données)
 * - Comparer le comportement réel de l’API avec les résultats des tests manuels
 * - Documenter les anomalies identifiées par Marie et leur correction éventuelle
 *
 * IMPORTANT :
 * Certains tests valident volontairement des comportements non conformes
 * afin de documenter des anomalies toujours présentes côté backend.
 * ============================================================================
 */

describe('API – Eco Bliss Bath', () => {

  // ---------------------------------------------------------------------------
  // VARIABLES GLOBALES
  // ---------------------------------------------------------------------------
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
     * RÉSULTAT OBSERVÉ :
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
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

// ---------------------------------------------------------------------------
// API-02 : ACCÈS À /orders AVEC AUTHENTIFICATION
// ---------------------------------------------------------------------------
it('API-02 : GET /orders connecté → 200 (tableau de commandes)', () => {

  /**
   * OBJECTIF :
   * Vérifier le comportement réel de la route /orders une fois authentifié.
   *
   * OBSERVATION :
   * - L’API retourne un objet représentant le panier ou la commande principale
   * - Cet objet contient au moins un champ "id"
   *
   * CONCLUSION QA :
   * - Test limité à la vérification d’accès et présence d’identifiant
   * - Comportement conforme à ce que Marie a observé
   */

  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/orders`,
    headers: { Authorization: `Bearer ${token}` }
  }).then((res) => {
    expect(res.status).to.eq(200);
    expect(res.body).to.be.an('object');          // Vérifie que c’est bien un objet
    expect(res.body).to.have.property('id');      // Vérifie que l’ID existe

    // Si l’objet contient un tableau de commandes internes, exemple : res.body.orders
    if (Array.isArray(res.body.orders)) {
      res.body.orders.forEach(order => {
        expect(order).to.have.property('id');    // Vérifie que chaque commande a un ID
      });
    }
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
     * - Test produit spécifique (id 5)
     * - Vérifie la structure complète du produit
     * - Vérifie que les valeurs métier sont cohérentes (stock ≥ 0)
     *
     * RÉSULTAT OBSERVÉ :
     * - Code 200 OK
     * - Structure conforme à Swagger
     * - Stock positif
     */
    const productId = 5;

    cy.request(`${Cypress.env('apiUrl')}/products/${productId}`)
      .then((resProduct) => {
        expect(resProduct.status).to.eq(200);
        expect(resProduct.body).to.have.all.keys(
          'id', 'name', 'availableStock', 'skin', 'aromas',
          'ingredients', 'description', 'price', 'picture', 'varieties'
        );
        expect(resProduct.body.id).to.eq(productId);
        expect(resProduct.body.availableStock).to.be.at.least(0);
      });
  });

  // ---------------------------------------------------------------------------
  // API-03b : PRODUIT INEXISTANT → 404
  // ---------------------------------------------------------------------------
  it('API-03b : GET /products/{id} inexistant → 404', () => {

    /**
     * OBJECTIF :
     * Vérifier le comportement de l’API lorsqu’un produit inexistant est demandé.
     *
     * RÉSULTAT OBSERVÉ :
     * - Code 404 Not Found
     *
     * CONCLUSION QA :
     * - Comportement conforme au brief
     */
    const nonExistentId = 9999;

    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/products/${nonExistentId}`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(404);
    });
  });

  // ---------------------------------------------------------------------------
  // API-04 : AJOUT D’UN PRODUIT AU PANIER
  // ---------------------------------------------------------------------------
  it('API-04 : PUT /orders/add → 400 (anomalie backend documentée)', () => {

    /**
     * OBJECTIF :
     * Tester l’ajout d’un produit au panier.
     *
     * ANOMALIES CONFIRMÉES :
     * - Route non conforme REST (PUT au lieu de POST)
     * - Validation backend rejette tout ajout
     *
     * RÉSULTAT OBSERVÉ :
     * - Code HTTP 400 Bad Request
     *
     * CONCLUSION QA :
     * - L’ajout au panier reste non fonctionnel
     * - Test documente le comportement actuel
     */
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/orders/add`,
      headers: { Authorization: `Bearer ${token}` },
      body: { product: '/products/5', quantity: 1 },
      failOnStatusCode: false
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
     * RÉSULTAT OBSERVÉ :
     * - Code 200 OK
     * - Avis correctement ajouté
     *
     * CONCLUSION QA :
     * - Comportement conforme au brief
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/reviews`,
      headers: { Authorization: `Bearer ${token}` },
      body: { title: 'Excellent produit', comment: 'Très bon savon', rating: 5 }
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  // ---------------------------------------------------------------------------
  // API-05b : POST /reviews SANS TOKEN → 401
  // ---------------------------------------------------------------------------
  it('API-05b : POST /reviews sans token → 401', () => {

    /**
     * OBJECTIF :
     * Vérifier qu’un utilisateur non authentifié ne peut pas poster d’avis.
     *
     * RÉSULTAT OBSERVÉ :
     * - Code 401 Unauthorized
     *
     * CONCLUSION QA :
     * - Comportement conforme au brief
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/reviews`,
      body: { title: 'Test', comment: 'Test', rating: 3 },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  // ---------------------------------------------------------------------------
  // API-06 : LOGIN AVEC IDENTIFIANTS INVALIDES → 401
  // ---------------------------------------------------------------------------
  it('API-06 : POST /login mauvais mot de passe → 401', () => {

    /**
     * OBJECTIF :
     * Vérifier que l’API refuse une connexion avec identifiants invalides.
     *
     * RÉSULTAT OBSERVÉ :
     * - Code 401 Unauthorized
     * - Message : "Invalid credentials."
     *
     * CONCLUSION QA :
     * - Comportement conforme au brief
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/login`,
      body: { username: 'string', password: 'wrongpassword' },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(401);
      expect(res.body).to.have.property('message', 'Invalid credentials.');
    });
  });

});
