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
    /**
     * OBJECTIF :
     * - Récupérer un token JWT pour les tests nécessitant authentification.
     *
     * STRATÉGIE :
     * - Utilisation d'un compte test défini dans Cypress.env
     * - Vérification que la connexion réussit avant de lancer les tests
     *
     * CONCLUSION QA :
     * - Token disponible pour tous les tests nécessitant authentification
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/login`,
      body: {
        username: Cypress.env('userEmail'),
        password: Cypress.env('userPassword')
      }
    }).then((res) => {
      expect(res.status).to.eq(200); 
      token = res.body.token;
      cy.log('TOKEN API:', token);
    });
  });

  // ===========================================================================
  // TESTS OBLIGATOIRES RECOMMANDÉS PAR MARIE
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // API-01 : ACCÈS AUX DONNÉES SENSIBLES SANS AUTHENTIFICATION
  // ---------------------------------------------------------------------------
  it('API-01 : GET /orders sans être connecté → 401 (anomalie sécurité)', () => {
    /**
     * OBJECTIF :
     * - Vérifier que l’accès aux commandes sans authentification est refusé
     *
     * STRATÉGIE :
     * - GET /orders sans token
     *
     * CONCLUSION QA :
     * - Le serveur renvoie bien 401
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
  it('API-02 : GET /orders connecté → 200 si panier existe / 404 si vide', () => {
    /**
     * OBJECTIF :
     * - Vérifier que l’utilisateur authentifié peut accéder à ses commandes
     *
     * STRATÉGIE :
     * - Créer une commande pour garantir un panier existant
     * - GET /orders et vérifier le format de réponse
     * - Supprimer la commande créée pour nettoyer l’état
     *
     * CONCLUSION QA :
     * - Test robuste, isolé, et indépendant de l’état précédent
     */
    // 1️⃣ Création d'une commande/panier
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/orders`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        firstname: Cypress.env('firstName'),
        lastname: Cypress.env('lastName'),
        address: Cypress.env('address'),
        zipCode: Cypress.env('zipCode'),
        city: Cypress.env('city')
      },
      failOnStatusCode: false
    }).then((resCreate) => {
      const orderId = resCreate.body.id;

      // 2️⃣ GET /orders
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/orders`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((res) => {
        expect([200, 404]).to.include(res.status);
        if (res.status === 200) {
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id');
          if (Array.isArray(res.body.orders)) {
            res.body.orders.forEach(order => {
              expect(order).to.have.property('id');
            });
          }
        }
      });

      // 3️⃣ Nettoyage : suppression de la commande créée
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/orders/${orderId}`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false
      }).then((resDelete) => {
        expect([204, 404]).to.include(resDelete.status);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // API-03 : CONSULTATION DU CATALOGUE PRODUITS - PRODUIT SPECIFIQUE
  // ---------------------------------------------------------------------------
  it('API-03 : GET /products/{id} → 200', () => {
    /**
     * OBJECTIF :
     * - Vérifier qu’un produit spécifique peut être consulté
     *
     * STRATÉGIE :
     * - GET /products/{id} avec un id existant
     *
     * CONCLUSION QA :
     * - Réponse 200 et toutes les clés attendues présentes
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
  // API-04 : AJOUT D’UN PRODUIT AU PANIER
  // ---------------------------------------------------------------------------
  it('API-04 : PUT /orders/add → 400 (anomalie backend documentée)', () => {
    /**
     * OBJECTIF :
     * - Vérifier la gestion d’un ajout produit avec problème backend connu
     *
     * STRATÉGIE :
     * - PUT /orders/add avec produit 5
     *
     * CONCLUSION QA :
     * - La requête renvoie bien 400 et contient le message d’erreur attendu
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
     * - Ajouter un avis sur un produit
     *
     * STRATÉGIE :
     * - POST /reviews avec token
     *
     * CONCLUSION QA :
     * - Réponse 200 confirmant l’ajout de l’avis
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
  // API-06 : LOGIN AVEC IDENTIFIANTS INVALIDES → 401
  // ---------------------------------------------------------------------------
  it('API-06 : POST /login mauvais mot de passe → 401', () => {
    /**
     * OBJECTIF :
     * - Vérifier que le login échoue avec mot de passe incorrect
     *
     * STRATÉGIE :
     * - POST /login avec mot de passe erroné
     *
     * CONCLUSION QA :
     * - Retour 401 et message d’erreur correct
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

  // ---------------------------------------------------------------------------
  // API-07 : AJOUT D’UN PRODUIT EN RUPTURE DE STOCK
  // ---------------------------------------------------------------------------
  it('API-07 : PUT /orders/add produit en rupture de stock → 400', () => {
    /**
     * OBJECTIF :
     * - Vérifier que l’ajout d’un produit en rupture de stock est refusé
     *
     * STRATÉGIE :
     * - PUT /orders/add avec produit en rupture
     *
     * CONCLUSION QA :
     * - Retour 400 attendu
     */
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/orders/add`,
      headers: { Authorization: `Bearer ${token}` },
      body: { product: '/products/3', quantity: 1 },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });

  // ===========================================================================
  // TESTS BONUS
  // ===========================================================================
  
  // ---------------------------------------------------------------------------
  // API-03b : PRODUIT INEXISTANT → 404
  // ---------------------------------------------------------------------------
  it('API-03b : GET /products/{id} inexistant → 404', () => {
    /**
     * OBJECTIF :
     * - Vérifier la gestion des produits inexistants
     *
     * STRATÉGIE :
     * - GET /products/{id} avec un id fictif
     *
     * CONCLUSION QA :
     * - Retour 404 correct
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
  // API-05b : POST /reviews SANS TOKEN → 401
  // ---------------------------------------------------------------------------
  it('API-05b : POST /reviews sans token → 401', () => {
    /**
     * OBJECTIF :
     * - Vérifier que l’ajout d’avis sans token est refusé
     *
     * STRATÉGIE :
     * - POST /reviews sans Authorization header
     *
     * CONCLUSION QA :
     * - Retour 401 correct
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

  // ========================================================================
  // TESTS SUPPLÉMENTAIRES SWAGGER (API-08 à API-16)
  // ========================================================================

  // ---------------------------------------------------------------------------
  // API-08 : GET /products (liste complète)
  // ---------------------------------------------------------------------------
  it('API-08 : GET /products → 200 (liste complète)', () => {
    /**
     * OBJECTIF :
     * - Vérifier la récupération complète des produits
     *
     * STRATÉGIE :
     * - GET /products
     *
     * CONCLUSION QA :
     * - Réponse 200 avec array de produits
     */
    cy.request(`${Cypress.env('apiUrl')}/products`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      if (res.body.length > 0) {
        res.body.forEach(product => {
          expect(product).to.have.property('id');
          expect(product).to.have.property('name');
        });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // API-09 : POST /orders (création commande)
  // ---------------------------------------------------------------------------
  it('API-09 : POST /orders → 201', () => {
    /**
     * OBJECTIF :
     * - Créer une commande via API
     *
     * STRATÉGIE :
     * - POST /orders avec token
     *
     * CONCLUSION QA :
     * - Commande créée avec retour 201 et id valide
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/orders`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        firstname: Cypress.env('firstName'),
        lastname: Cypress.env('lastName'),
        address: Cypress.env('address'),
        zipCode: Cypress.env('zipCode'),
        city: Cypress.env('city')
      }
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body).to.have.property('id');
    });
  });

  // ---------------------------------------------------------------------------
  // API-10 : PUT /orders/{id} (mise à jour commande)
  // ---------------------------------------------------------------------------
  it('API-10 : PUT /orders/{id} → 200', () => {
    /**
     * OBJECTIF :
     * - Modifier le statut d’une commande existante
     *
     * STRATÉGIE :
     * - POST /orders pour créer une commande
     * - PUT /orders/{id} pour changer le statut
     *
     * CONCLUSION QA :
     * - Retour 200 et id correct
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/orders`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        firstname: Cypress.env('firstName'),
        lastname: Cypress.env('lastName'),
        address: Cypress.env('address'),
        zipCode: Cypress.env('zipCode'),
        city: Cypress.env('city')
      }
    }).then((res) => {
      const orderId = res.body.id;
      cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/orders/${orderId}`,
        headers: { Authorization: `Bearer ${token}` },
        body: { status: 'confirmed' }
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('id', orderId);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // API-11 : DELETE /orders/{id} (suppression commande)
  // ---------------------------------------------------------------------------
  it('API-11 : DELETE /orders/{id} → 204', () => {
    /**
     * OBJECTIF :
     * - Supprimer une commande via API
     *
     * STRATÉGIE :
     * - POST /orders puis DELETE /orders/{id}
     *
     * CONCLUSION QA :
     * - Retour 204 confirmant suppression
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/orders`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        firstname: Cypress.env('firstName'),
        lastname: Cypress.env('lastName'),
        address: Cypress.env('address'),
        zipCode: Cypress.env('zipCode'),
        city: Cypress.env('city')
      }
    }).then((res) => {
      const orderId = res.body.id;
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/orders/${orderId}`,
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        expect(res.status).to.eq(204);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // API-12 : GET /reviews (liste avis)
  // ---------------------------------------------------------------------------
  it('API-12 : GET /reviews → 200', () => {
    /**
     * OBJECTIF :
     * - Récupérer la liste complète des avis
     *
     * STRATÉGIE :
     * - GET /reviews
     *
     * CONCLUSION QA :
     * - Retour 200 et tableau d’avis valide
     */
    cy.request(`${Cypress.env('apiUrl')}/reviews`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
    });
  });

  // ---------------------------------------------------------------------------
  // API-13 : GET /users/{id} (infos utilisateur)
  // ---------------------------------------------------------------------------
  it('API-13 : GET /users/{id} → 200', () => {
    /**
     * OBJECTIF :
     * - Vérifier l’accès aux informations utilisateur
     *
     * STRATÉGIE :
     * - POST /api/users pour créer un utilisateur
     * - GET /api/users/{id} pour récupérer les infos
     *
     * CONCLUSION QA :
     * - Retour 200 et id correct
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/users`,
      body: {
        username: Cypress.env('userName'),
        email: Cypress.env('userEmail'),
        password: Cypress.env('userPassword')
      },
      failOnStatusCode: false
    }).then((res) => {
      const userId = res.body.id;
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/api/users/${userId}`,
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('id', userId);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // API-14 : POST /users (création utilisateur)
  // ---------------------------------------------------------------------------
  it('API-14 : POST /users → 201', () => {
    /**
     * OBJECTIF :
     * - Créer un utilisateur via API
     *
     * STRATÉGIE :
     * - POST /api/users
     *
     * CONCLUSION QA :
     * - Retour 201 et id utilisateur valide
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/users`,
      body: {
        username: Cypress.env('userName'),
        email: Cypress.env('userEmail'),
        password: Cypress.env('userPassword')
      },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body).to.have.property('id');
    });
  });

  // ---------------------------------------------------------------------------
  // API-15 : PUT /users/{id} (mise à jour utilisateur)
  // ---------------------------------------------------------------------------
  it('API-15 : PUT /users/{id} → 200', () => {
    /**
     * OBJECTIF :
     * - Mettre à jour un utilisateur existant
     *
     * STRATÉGIE :
     * - POST /api/users puis PUT /api/users/{id}
     *
     * CONCLUSION QA :
     * - Retour 200 et id correct
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/users`,
      body: {
        username: Cypress.env('userName'),
        email: Cypress.env('userEmail'),
        password: Cypress.env('userPassword')
      },
      failOnStatusCode: false
    }).then((res) => {
      const userId = res.body.id;
      cy.request({
        method: 'PUT',
        url: `${Cypress.env('apiUrl')}/api/users/${userId}`,
        headers: { Authorization: `Bearer ${token}` },
        body: { email: 'updated@example.com' }
      }).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body).to.have.property('id', userId);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // API-16 : DELETE /users/{id} (suppression utilisateur)
  // ---------------------------------------------------------------------------
  it('API-16 : DELETE /users/{id} → 204', () => {
    /**
     * OBJECTIF :
     * - Supprimer un utilisateur via API
     *
     * STRATÉGIE :
     * - POST /api/users puis DELETE /api/users/{id}
     *
     * CONCLUSION QA :
     * - Retour 204 confirmant suppression
     */
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/users`,
      body: {
        username: Cypress.env('userName'),
        email: Cypress.env('userEmail'),
        password: Cypress.env('userPassword')
      },
      failOnStatusCode: false
    }).then((res) => {
      const userId = res.body.id;
      cy.request({
        method: 'DELETE',
        url: `${Cypress.env('apiUrl')}/api/users/${userId}`,
        headers: { Authorization: `Bearer ${token}` }
      }).then((res) => {
        expect(res.status).to.eq(204);
      });
    });
  });

  // ---------------------------------------------------------------------------
// API-17 : PUT /orders/{id}/change-quantity (modifier quantité produit)
// ---------------------------------------------------------------------------
it('API-17 : PUT /orders/{id}/change-quantity → 200', () => {
  /**
   * OBJECTIF :
   * - Modifier la quantité d’un produit dans le panier
   *
   * STRATÉGIE :
   * - Créer une commande avec un produit
   * - Modifier la quantité via PUT /orders/{id}/change-quantity
   *
   * CONCLUSION QA :
   * - Retour 200 et produit mis à jour
   */
  // Étape 1 : créer une commande avec un produit
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/orders`,
    headers: { Authorization: `Bearer ${token}` },
    body: {
      firstname: Cypress.env('firstName'),
      lastname: Cypress.env('lastName'),
      address: Cypress.env('address'),
      zipCode: Cypress.env('zipCode'),
      city: Cypress.env('city'),
      products: [
        { productId: 1, quantity: 2 } // exemple
      ]
    }
  }).then((res) => {
    const orderId = res.body.id;

    // Étape 2 : modifier la quantité
    cy.request({
      method: 'PUT',
      url: `${Cypress.env('apiUrl')}/orders/${orderId}/change-quantity`,
      headers: { Authorization: `Bearer ${token}` },
      body: { quantity: 5 } // nouvelle quantité
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('quantity', 5);
      expect(res.body).to.have.property('product');
    });
  });
});

});