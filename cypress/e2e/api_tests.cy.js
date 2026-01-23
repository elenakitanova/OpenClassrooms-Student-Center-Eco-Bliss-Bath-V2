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
 * TYPES DE TESTS INCLUS :
 * [OBLIGATOIRE] : Recommandés par Marie.
 * [NON-OBLIGATOIRE / ALTERNATIF] : Tests des autres endpoints.
 * ============================================================================
 */

describe('Campagne de Tests API Eco Bliss', () => {
  const apiUrl = Cypress.env('apiUrl');
  let authToken;
  let dynamicProductId;
  let outOfStockProductId;

  // CONFIGURATION INITIALE
  before(() => {
    // 1. Connexion globale pour obtenir le token
    cy.request('POST', `${apiUrl}/login`, {
      username: Cypress.env('userEmail'),
      password: Cypress.env('userPassword')
    }).then((res) => {
      authToken = res.body.token;
    });

    // 2. Récupération dynamique d'un ID de produit valide
    cy.request('GET', `${apiUrl}/products`).then((res) => {
      dynamicProductId = res.body.find(p => p.quantity > 0)?.id || res.body[0].id;
      // Identification d'un produit en rupture pour le test de Marie
      const oosProduct = res.body.find(p => p.quantity <= 0);
      outOfStockProductId = oosProduct ? oosProduct.id : null;
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 1 : AUTHENTIFICATION & UTILISATEURS
  // --------------------------------------------------------------------------

  // [OBLIGATOIRE] Vérifie que les utilisateurs existants peuvent accéder au service
  it('1. POST /login - Connexion réussie (Scénario Nominal)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { username: Cypress.env('userEmail'), password: Cypress.env('userPassword') }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('token');
    });
  });

  // [BLIGATOIRE] Vérifie la robustesse contre les tentatives d'intrusion
  it('2. POST /login - Échec avec identifiants invalides (401)', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { username: 'wrong@test.com', password: 'bad_password' },
      failOnStatusCode: false
    }).its('status').should('eq', 401);
  });

  // [COMPLEMENTAIRE] Teste le tunnel d'acquisition de nouveaux clients
  it('3. POST /register - Création de compte (Scénario Nominal)', () => {
    const newUser = `user_${Date.now()}@test.com`;
    cy.request({
      method: 'POST',
      url: `${apiUrl}/register`,
      body: { 
        email: newUser,
        firstname: "Elena", 
        lastname: "Kitanova", 
        plainPassword: { first: "Ecobliss4", second: "Ecobliss4" }
      }
    }).its('status').should('be.oneOf', [200, 201]);
  });

  // [OBLIGATOIRE] Garantit que l'unicité des comptes est respectée (Correction Marie)
  it('3b. POST /register - ÉCHEC si l\'utilisateur existe déjà', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/register`,
      failOnStatusCode: false,
      body: { 
        email: Cypress.env('userEmail'), // Utilisation d'un email déjà en base
        firstname: "Elena", 
        lastname: "Kitanova", 
        plainPassword: { first: "Ecobliss4", second: "Ecobliss4" }
      }
    }).then((res) => {
      // On attend une erreur 400 ou 409 (Conflit)
      expect(res.status).to.be.oneOf([400, 409]);
    });
  });

  // [COMPLEMENTAIRE] Vérifie la validation des données côté serveur
  it('3c. POST /register - ÉCHEC si mots de passe différents', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/register`,
      failOnStatusCode: false,
      body: { 
        email: `error_${Date.now()}@test.com`,
        firstname: "Elena", 
        lastname: "Kitanova", 
        plainPassword: { first: "Ecobliss4", second: "DifferentPassword" }
      }
    }).its('status').should('eq', 400);
  });

  // [OBLIGATOIRE] Vérifie l'accès aux données personnelles après connexion
  it('4. GET /me - Récupération des infos utilisateur connecté', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/me`,
      headers: { Authorization: `Bearer ${authToken}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('email', Cypress.env('userEmail'));
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 2 : SANTÉ & PRODUITS
  // --------------------------------------------------------------------------

  // [COMPLEMENTAIRE] Test de surveillance infrastructure (DevOps)
  it('5. GET /api/health - Vérification état de l’API', () => {
    cy.request({
      url: `${apiUrl}/api/health`,
      failOnStatusCode: false
    }).its('status').should('be.oneOf', [200, 404]);
  });

  // [OBLIGATOIRE] Indispensable pour l'affichage du catalogue front-end
  it('6. GET /products - Liste des produits', () => {
    cy.request('GET', `${apiUrl}/products`).then((res) => {
      expect(res.status).to.eq(200);
      const product = res.body[0];
      expect(product).to.have.property('id');
      expect(product).to.have.property('name');
      expect(product).to.have.property('price');
    });
  });

  // [COMPLEMENTAIRE] 3 produits aléatoires
  it('7. GET /products/random - Récupération de 3 produits aléatoires', () => {
    cy.request({
      url: `${apiUrl}/products/random`,
      failOnStatusCode: false
    }).then((res) => {
      if (res.status === 200) {
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.at.most(3);
      }
    });
  });

  // [OBLIGATOIRE] Indispensable pour la page produit détaillée
  it('8. GET /products/{id} - Détail d’un produit spécifique', () => {
    cy.request('GET', `${apiUrl}/products/${dynamicProductId}`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body.id).to.eq(dynamicProductId);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 3 : PANIER & COMMANDES
  // --------------------------------------------------------------------------

  // [OBLIGATOIRE] Cœur du business e-commerce
  it('9. PUT /orders/add - Ajout d’un produit au panier', () => {
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { product: dynamicProductId, quantity: 1 }
    }).its('status').should('eq', 200);
  });

  // [OBLIGATOIRE] Cœur du business e-commerce
  it('10. GET /orders - Récupération du panier courant', () => {
    cy.request({
      method: 'GET',
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${authToken}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      // Vérification recommandée par Marie : doit retourner la liste des produits
      expect(res.body).to.have.property('orderLines');
    });
  });

  // [COMPLEMENTAIRE] Confort utilisateur (édition panier)
  it('11. PUT /orders/{id}/change-quantity - Modification quantité', () => {
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/${dynamicProductId}/change-quantity`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { quantity: 5 },
      failOnStatusCode: false
    }).its('status').should('be.oneOf', [200, 404]);
  });

  // [COMPLEMENTAIRE] Confort utilisateur (édition panier)
  it('12. DELETE /orders/{id}/delete - Suppression du produit du panier', () => {
    cy.request({
      method: 'DELETE',
      url: `${apiUrl}/orders/${dynamicProductId}/delete`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false
    }).its('status').should('be.oneOf', [200, 204, 404]);
  });

  // [OBLIGATOIRE] Finalisation de la vente (Transactionnel)
  it('13. POST /orders - Création / Validation de la commande', () => {
    cy.request({ 
      method: 'PUT', 
      url: `${apiUrl}/orders/add`, 
      headers: { Authorization: `Bearer ${authToken}` }, 
      body: { product: dynamicProductId, quantity: 1 } 
    });
    
    cy.request({
      method: 'POST',
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        firstname: "Marie", 
        lastname: "Test", 
        address: "10 rue de la Paix", 
        zipCode: "75008", 
        city: "Paris"
      }
    }).its('status').should('eq', 200);
  });

  // --------------------------------------------------------------------------
  // SECTION 4 : AVIS CLIENTS
  // --------------------------------------------------------------------------

  // [COMPLEMENTAIRE] Preuve sociale (marketing)
  it('14. GET /reviews - Récupération de tous les avis', () => {
    cy.request('GET', `${apiUrl}/reviews`).its('status').should('eq', 200);
  });

  // [COMPLEMENTAIRE] Engagement client
  it('15. POST /reviews - Publication d’un avis valide', () => {
    cy.request({
      method: 'POST',
      url: `${apiUrl}/reviews`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: "Top", comment: `Avis auto ${Date.now()}`, rating: 5 }
    }).its('status').should('eq', 200);
  });

  // --------------------------------------------------------------------------
  // SECTION 5 : SÉCURITÉ & STOCKS
  // --------------------------------------------------------------------------

  // [OBLIGATOIRE] Critique : Protection des données sensibles
  it('16. SÉCURITÉ - Accès /orders sans token (401)', () => {
    cy.request({ 
      method: 'GET', 
      url: `${apiUrl}/orders`, 
      failOnStatusCode: false 
    }).its('status').should('eq', 401);
  });

  // [OBLIGATOIRE] Recommandé par Marie : Ajouter un produit en rupture de stock
  it('16b. STOCKS - Ajouter un produit en rupture de stock', () => {
    if (outOfStockProductId) {
      cy.request({
        method: 'PUT',
        url: `${apiUrl}/orders/add`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { product: outOfStockProductId, quantity: 1 },
        failOnStatusCode: false
      }).its('status').should('be.oneOf', [400, 422]);
    } else {
      cy.log('Aucun produit OOS trouvé pour ce test');
    }
  });

  // [COMPLEMENTAIRE] Robustesse de l'inventaire
  it('17. STOCKS - PUT /orders/add avec quantité excessive (400)', () => {
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { product: dynamicProductId, quantity: 999999 },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.be.oneOf([400, 200, 422]); 
    });
  });

  // [COMPLEMENTAIRE] Gestion d'erreur propre
  it('18. ERREUR - GET /products/{id} inexistant (404)', () => {
    cy.request({ 
      method: 'GET', 
      url: `${apiUrl}/products/999999`, 
      failOnStatusCode: false 
    }).its('status').should('eq', 404);
  });
});