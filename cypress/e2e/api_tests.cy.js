/**
 * ============================================================================
 * CAMPAGNE DE TEST API – ECO BLISS BATH (VERSION AUTOMATISÉE)
 * ============================================================================
 *
 * CONTEXTE
 * ----------------------------------------------------------------------------
 * Eco Bliss Bath est une application e-commerce de produits de beauté
 * écoresponsables. Cette suite automatise une campagne de tests API construite
 * à partir des tests manuels réalisés par Marie (référentiel fonctionnel).
 *
 * OBJECTIF GÉNÉRAL (QUALITÉ + CONFORMITÉ)
 * ----------------------------------------------------------------------------
 * - Sécuriser les parcours critiques côté API (authentification, accès aux données).
 * - Vérifier le contrat des endpoints (statuts HTTP, format de réponse, règles métier).
 * - Comparer le comportement observé avec les attentes issues de la campagne manuelle.
 * - Documenter les non-conformités (tests volontairement rouges) pour mise en conformité.
 *
 * PÉRIMÈTRE DES TESTS
 * ----------------------------------------------------------------------------
 * - Authentification / Utilisateur : /login, /register, /me
 * - Santé & Produits : /api/health, /products, /products/random, /products/{id}
 * - Panier & Commandes : /orders, /orders/add, /change-quantity, /delete, /checkout
 * - Avis : /reviews
 * - Stock : règles métier autour de availableStock
 *
 * TYPES DE TESTS
 * ----------------------------------------------------------------------------
 * [OBLIGATOIRE] : recommandés par Marie (priorité d’évaluation).
 * [NON-OBLIGATOIRE / ALTERNATIF] : couverture complémentaire des endpoints.
 * [VOLONTAIREMENT ROUGE] : non-conformités confirmées (écarts attendus/observés).
 * ============================================================================
 */

describe('Campagne de Tests API Eco Bliss', () => {
  const apiUrl = Cypress.env('apiUrl');
  let authToken;

  // IDs dynamiques basés sur la base reset Docker
  let inStockProductId;      // produit avec stock > 0 (utile pour parcours panier / commande)
  let outOfStockProductId;   // produit avec stock <= 0 (utile pour test règle stock)

  const getStock = (p) => {
    // =========================================================================
    // OBJECTIF TECHNIQUE
    // =========================================================================
    // Normaliser la lecture du stock exposé par l’API.
    //
    // CONTEXTE
    // =========================================================================
    // - Le champ exposé par l’API est "availableStock".
    // - Il provient de la base MariaDB (available_stock -> availableStock).
    //
    // PREUVE ATTENDUE
    // =========================================================================
    // - Retourne un nombre si availableStock est correctement typé.
    // - Retourne null si non présent / non conforme.
    // =========================================================================
    return typeof p?.availableStock === 'number' ? p.availableStock : null;
  };

  /**
   * ============================================================================
   * HELPER — getOrderLineIdForProduct(productId)
   * ============================================================================
   * OBJECTIF
   * - Récupérer l’ID de ligne panier (orderLine.id) correspondant à un produit donné.
   *
   * POURQUOI CE HELPER ?
   * - Certains tests doivent supprimer / modifier une ligne sans supposer un ID fixe.
   * - On évite les tests fragiles dépendant d’une base “dans un état précis”.
   *
   * PREUVE (SI UTILISÉ)
   * - Permet de nettoyer proprement le panier en fin de scénario.
   * ============================================================================
   */
  const getOrderLineIdForProduct = (productId) => {
    return cy.request({
      method: 'GET',
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${authToken}` },
      failOnStatusCode: false
    }).then((res) => {
      if (res.status !== 200) return null;

      const lines = Array.isArray(res.body?.orderLines) ? res.body.orderLines : [];
      const lineForProduct = lines.find((l) => l?.product?.id === productId);
      return lineForProduct?.id ?? null;
    });
  };

  // ============================================================================
  // CONFIGURATION INITIALE — PRÉREQUIS DE CAMPAGNE
  // ============================================================================
  before(() => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Préparer les prérequis communs à toute la campagne :
    // - un token valide
    // - un produit "en stock"
    // - un produit "hors stock" si disponible
    //
    // ATTENDU (TECHNIQUE)
    // =========================================================================
    // - L’API est joignable.
    // - /products retourne une liste non vide.
    // - On peut identifier au moins un produit achetable (stock > 0).
    // =========================================================================
    cy.apiLogin().then((token) => {
      authToken = token;
    });

    cy.request('GET', `${apiUrl}/products`).then((res) => {
      const products = Array.isArray(res.body) ? res.body : [];
      expect(products.length, 'La liste produits ne doit pas être vide').to.be.greaterThan(0);

      // Produit en stock pour les scénarios panier
      const inStock = products.find((p) => (getStock(p) ?? 0) > 0);
      inStockProductId = inStock?.id ?? products[0]?.id;

      // Produit OOS (0 ou négatif) pour test stock
      const oos = products.find((p) => (getStock(p) ?? 0) <= 0);
      outOfStockProductId = oos?.id ?? null;
    });
  });

  beforeEach(() => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Garantir un token valide avant chaque test.
    //
    // POURQUOI ?
    // =========================================================================
    // - Évite les faux négatifs liés à l’expiration JWT.
    // - Assure l’indépendance des tests : chaque it() se suffit.
    // =========================================================================
    cy.apiLogin().then((token) => {
      authToken = token;
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 1 : AUTHENTIFICATION & UTILISATEURS
  // --------------------------------------------------------------------------

  it('1. POST /login - Connexion réussie (Scénario Nominal)', () => {
    // (OBLIGATOIRE - RECOMMANDÉ PAR MARIE)=====================================
    // OBJECTIF FONCTIONNEL
    // =========================================================================
    // Valider le scénario nominal d’authentification via l’API.
    //
    // CE QUE JE VEUX VÉRIFIER
    // =========================================================================
    // - Que l’API accepte des identifiants valides.
    // - Qu’elle retourne un token exploitable (JWT) pour accéder aux endpoints protégés.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’utilisateur peut se connecter avec ses identifiants.
    //
    // ATTENDU CÔTÉ BUSINESS / SÉCURITÉ
    // =========================================================================
    // - Un accès aux données personnelles et au panier n’est possible qu’après authentification.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // - body contient "token"
    // =========================================================================
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { username: Cypress.env('userEmail'), password: Cypress.env('userPassword') }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('token');
    });
  });

  it('2. POST /login - Échec avec identifiants invalides (401)', () => {
    // (OBLIGATOIRE - RECOMMANDÉ PAR MARIE)=====================================
    // OBJECTIF SÉCURITÉ
    // =========================================================================
    // Vérifier que l’API refuse une authentification avec identifiants invalides.
    //
    // CE QUE JE VEUX VÉRIFIER
    // =========================================================================
    // - Qu’aucun token n’est délivré si l’email/mot de passe est incorrect.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’utilisateur reçoit un refus de connexion.
    //
    // ATTENDU CÔTÉ BUSINESS / SÉCURITÉ
    // =========================================================================
    // - Protection contre l’accès non autorisé.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 401
    // =========================================================================
    cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: { username: 'wrong@test.com', password: 'bad_password' },
      failOnStatusCode: false
    }).its('status').should('eq', 401);
  });

  it('3. POST /register - Création de compte (Scénario Nominal)', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF FONCTIONNEL
    // =========================================================================
    // Vérifier qu’un utilisateur peut créer un compte via l’API.
    //
    // CE QUE JE VEUX VÉRIFIER
    // =========================================================================
    // - Que le endpoint /register accepte un payload conforme.
    // - Que le compte est créé (réponse contenant au minimum l’email).
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’utilisateur peut s’inscrire et ensuite se connecter.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Acquisition utilisateur : création de compte fiable.
    //
    // NOTE TECHNIQUE (OBSERVATION)
    // =========================================================================
    // Swagger UI affiche plainPassword: string,
    // mais le backend attend { first, second } (vu lors d’un retour 400).
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // - body contient "email"
    // =========================================================================

    const newUser = `user_${Date.now()}@test.com`;

    const registerFirstName = Cypress.env('registerFirstName');
    const registerLastName = Cypress.env('registerLastName');
    const registerPassword = Cypress.env('registerPassword');

    expect(registerFirstName, 'registerFirstName doit être défini').to.be.a('string').and.not.be.empty;
    expect(registerLastName, 'registerLastName doit être défini').to.be.a('string').and.not.be.empty;
    expect(registerPassword, 'registerPassword doit être défini').to.be.a('string').and.not.be.empty;

    cy.request({
      method: 'POST',
      url: `${apiUrl}/register`,
      body: {
        email: newUser,
        firstname: registerFirstName,
        lastname: registerLastName,
        plainPassword: { first: registerPassword, second: registerPassword }
      }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('email');
    });
  });

  it('3b. POST /register - ÉCHEC si l\'utilisateur existe déjà', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF
    // =========================================================================
    // Vérifier la règle d’unicité : l’API refuse la création d’un compte déjà existant.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - Impossible de créer deux comptes avec le même email.
    //
    // ATTENDU CÔTÉ BUSINESS / SÉCURITÉ
    // =========================================================================
    // - Intégrité des données.
    // - Évite la duplication de comptes / conflits panier / commandes.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 400
    // =========================================================================
    cy.request({
      method: 'POST',
      url: `${apiUrl}/register`,
      failOnStatusCode: false,
      body: {
        email: Cypress.env('userEmail'),
        firstname: Cypress.env('registerFirstName'),
        lastname: Cypress.env('registerLastName'),
        plainPassword: {
          first: Cypress.env('registerPassword'),
          second: Cypress.env('registerPassword')
        }
      }
    }).then((res) => {
      expect(res.status).to.eq(400);
    });
  });

  it('3c. POST /register - ÉCHEC si mots de passe différents', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF
    // =========================================================================
    // Vérifier la validation du formulaire d’inscription côté API :
    // deux mots de passe différents doivent être refusés.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’utilisateur est bloqué et doit corriger son mot de passe.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Réduction du risque de comptes inutilisables (erreur de saisie).
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 400
    // - body contient une erreur sur plainPassword
    // =========================================================================
    cy.request({
      method: 'POST',
      url: `${apiUrl}/register`,
      failOnStatusCode: false,
      body: {
        email: `error_${Date.now()}@test.com`,
        firstname: Cypress.env('registerFirstName'),
        lastname: Cypress.env('registerLastName'),
        plainPassword: {
          first: Cypress.env('registerPassword'),
          second: Cypress.env('registerPasswordMismatch') || 'DifferentPassword'
        }
      }
    }).then((res) => {
      expect(res.status).to.eq(400);
      expect(res.body).to.have.property('plainPassword');
    });
  });

  it('4. GET /me - Récupération des infos utilisateur connecté', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF
    // =========================================================================
    // Vérifier qu’un utilisateur authentifié peut accéder à ses données via /me.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - Accès aux informations de compte.
    //
    // ATTENDU CÔTÉ BUSINESS / SÉCURITÉ
    // =========================================================================
    // - Endpoint protégé : accessible uniquement avec token valide.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // - body contient l’email attendu
    // =========================================================================
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

  it('5. GET /api/health - Vérification état de l’API', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF
    // =========================================================================
    // Vérifier que l’API répond et qu’elle est opérationnelle (health check).
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’application doit être accessible (sinon parcours e-commerce impossible).
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Disponibilité service : l’API doit être "UP".
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // =========================================================================
    cy.request({
      method: 'GET',
      url: `${apiUrl}/api/health`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(200);
    });
  });

  it('6. GET /products - Liste des produits', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF
    // =========================================================================
    // Vérifier que le catalogue produit est accessible et conforme au contrat minimal.
    //
    // CE QUE JE VEUX VÉRIFIER
    // =========================================================================
    // - /products retourne un tableau.
    // - Chaque produit contient les champs critiques (id, name, price, availableStock).
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - Le catalogue peut être affiché dans l’UI.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Les produits doivent être listables (sinon vente impossible).
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // - body est un array
    // - un produit contient les champs attendus
    // =========================================================================
    cy.request('GET', `${apiUrl}/products`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');

      const product = res.body[0];
      expect(product).to.have.property('id');
      expect(product).to.have.property('name');
      expect(product).to.have.property('price');
      expect(product).to.have.property('availableStock');
    });
  });

  it('7. GET /products/random - Récupération de 3 produits aléatoires', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF
    // =========================================================================
    // Vérifier le endpoint "random products" utilisé pour la mise en avant.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’utilisateur voit une sélection de produits (ex : accueil).
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Mise en avant / merchandising : rotation de produits.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // - body est un array
    // - taille <= 3
    // =========================================================================
    cy.request('GET', `${apiUrl}/products/random`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.be.an('array');
      expect(res.body.length).to.be.at.most(3);
    });
  });

  it('8. GET /products/{id} - Détail d’un produit spécifique', () => {
    // (OBLIGATOIRE - RECOMMANDÉ PAR MARIE)=====================================
    // OBJECTIF
    // =========================================================================
    // Vérifier qu’un produit existant peut être consulté par ID.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - La fiche produit doit pouvoir s’afficher.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Un produit doit être consultable avant achat.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // - body.id = id demandé
    // =========================================================================
    cy.request('GET', `${apiUrl}/products/${inStockProductId}`).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('id', inStockProductId);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 3 : PANIER & COMMANDES
  // --------------------------------------------------------------------------

  it('9–13. SCÉNARIO BOUT EN BOUT - Panier → Commande (Add => Get => Change Qty => Delete => Checkout)', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF FONCTIONNEL
    // =========================================================================
    // Valider un scénario complet "panier -> commande" via l’API.
    //
    // CE QUE JE VEUX VÉRIFIER
    // =========================================================================
    // - Ajout au panier fonctionne (/orders/add).
    // - Lecture panier fonctionne (/orders).
    // - Modification quantité fonctionne (/change-quantity).
    // - Suppression ligne fonctionne (/delete).
    // - Checkout fonctionne (/orders POST).
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - Le parcours de commande est réalisable jusqu’au bout.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Conversion : un panier doit pouvoir devenir une commande validée.
    // - Fiabilité : chaque étape doit être cohérente (quantité, suppression, validation).
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - Chaque endpoint renvoie 200
    // - Le panier contient une ligne exploitable (orderLineId)
    // - Le checkout renvoie 200
    // =========================================================================

    let orderLineId; // ID de ligne panier (important pour delete/change-quantity)

    // 9. PUT /orders/add
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { product: inStockProductId, quantity: 1 }
    }).its('status').should('eq', 200);

    // 10. GET /orders
    cy.request({
      method: 'GET',
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${authToken}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('orderLines');

      // Contrat : la réponse doit retourner un tableau de lignes panier.
      expect(res.body.orderLines).to.be.an('array');

      const lines = Array.isArray(res.body.orderLines) ? res.body.orderLines : [];
      const lineForProduct = lines.find((l) => l?.product?.id === inStockProductId);
      orderLineId = lineForProduct?.id ?? lines[0]?.id;

      // Preuve de continuité du scénario : il faut un ID de ligne exploitable pour continuer.
      expect(orderLineId, 'orderLineId doit être défini pour la suite du scénario').to.exist;
    });

    // 11. PUT /orders/{id}/change-quantity
    cy.then(() => {
      cy.request({
        method: 'PUT',
        url: `${apiUrl}/orders/${orderLineId}/change-quantity`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { quantity: 5 }
      }).its('status').should('eq', 200);
    });

    // 12. DELETE /orders/{id}/delete
    cy.then(() => {
      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/orders/${orderLineId}/delete`,
        headers: { Authorization: `Bearer ${authToken}` }
      }).its('status').should('eq', 200);
    });

    // 13. POST /orders (checkout) : on recrée un panier
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { product: inStockProductId, quantity: 1 }
    }).its('status').should('eq', 200);

    cy.request({
      method: 'POST',
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: {
        firstname: Cypress.env('firstName'),
        lastname: Cypress.env('lastName'),
        address: Cypress.env('address'),
        zipCode: Cypress.env('zipCode'),
        city: Cypress.env('city')
      }
    }).its('status').should('eq', 200);

    // Nettoyage : éviter accumulation panier et impacts stock entre scénarios.
    cy.then(() => getOrderLineIdForProduct(inStockProductId)).then((id) => {
      if (!id) return;

      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/orders/${id}/delete`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false
      });
    });
  });

  it('10b. GET /orders - Doit retourner la liste des produits du panier (contrat)', () => {
    // (OBLIGATOIRE - RECOMMANDÉ PAR MARIE)====================================
    // OBJECTIF (TEST CONTRAT)
    // =========================================================================
    // Vérifier que /orders retourne bien la liste des produits présents dans le panier.
    //
    // CE QUE JE VEUX VÉRIFIER
    // =========================================================================
    // - Après ajout, /orders contient une orderLine correspondant au produit ajouté.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - Le contenu du panier est récupérable et affichable.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Un panier doit être consultable et fidèle aux actions utilisateur.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // - orderLines est un tableau
    // - le produit ajouté est présent
    // =========================================================================

    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { product: inStockProductId, quantity: 1 }
    }).its('status').should('eq', 200);

    cy.request({
      method: 'GET',
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${authToken}` }
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('orderLines');
      expect(res.body.orderLines).to.be.an('array');

      const lines = Array.isArray(res.body.orderLines) ? res.body.orderLines : [];
      const lineForProduct = lines.find((l) => l?.product?.id === inStockProductId);

      expect(lineForProduct, 'Le panier doit contenir le produit ajouté').to.exist;
    });

    cy.then(() => getOrderLineIdForProduct(inStockProductId)).then((id) => {
      if (!id) return;

      cy.request({
        method: 'DELETE',
        url: `${apiUrl}/orders/${id}/delete`,
        headers: { Authorization: `Bearer ${authToken}` },
        failOnStatusCode: false
      });
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 3b : NON-CONFORMITÉS CONFIRMÉES (TESTS VOLONTAIREMENT ROUGES)
  // (OBLIGATOIRE - RECOMMANDÉ PAR MARIE)
  // --------------------------------------------------------------------------

  it('NC-1 (Anomalie Marie) - /orders sans token devrait renvoyer 403 (volontairement rouge)', () => {
    // =========================================================================
    // OBJECTIF (CONFORMITÉ SÉCURITÉ)
    // =========================================================================
    // Confirmer l’écart observé entre la règle attendue et le comportement actuel.
    //
    // RÈGLE ATTENDUE (RÉFÉRENTIEL MARIE)
    // =========================================================================
    // - Sans token : 403 Forbidden (accès interdit à une ressource protégée).
    //
    // OBSERVÉ ACTUELLEMENT
    // =========================================================================
    // - 401 Unauthorized
    //
    // STATUT DU TEST
    // =========================================================================
    // - Ce test est volontairement rouge tant que l’API n’est pas alignée.
    // - Il sert de preuve de non-conformité et de point de contrôle pour correction.
    // =========================================================================
    cy.request({
      method: 'GET',
      url: `${apiUrl}/orders`,
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.eq(403);
    });
  });

  it('NC-2 (Anomalie Marie) - /orders/add devrait être un POST (volontairement rouge)', () => {
    // =========================================================================
    // OBJECTIF (CONFORMITÉ REST)
    // =========================================================================
    // Confirmer la non-conformité “méthode HTTP” sur l’ajout au panier.
    //
    // RÈGLE ATTENDUE (RÉFÉRENTIEL MARIE / BONNES PRATIQUES)
    // =========================================================================
    // - Ajout de ressource => POST /orders/add
    //
    // OBSERVÉ ACTUELLEMENT
    // =========================================================================
    // - L’API implémente PUT /orders/add
    // - Un POST renvoie 405 Method Not Allowed
    //
    // STATUT DU TEST
    // =========================================================================
    // - Volontairement rouge tant que l’API n’est pas alignée.
    // =========================================================================

    cy.request({
      method: 'POST',
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { product: inStockProductId, quantity: 1 },
      failOnStatusCode: false
    }).then((res) => {
      expect(res.status).to.be.oneOf([200, 201]);
    });
  });

  // --------------------------------------------------------------------------
  // SECTION 4 : AVIS CLIENTS
  // --------------------------------------------------------------------------

  it('14. GET /reviews - Récupération de tous les avis', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF
    // =========================================================================
    // Vérifier l’accès à la liste des avis clients.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’utilisateur peut consulter des avis (preuve sociale).
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Mise en confiance et conversion via avis publics.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200
    // =========================================================================
    cy.request('GET', `${apiUrl}/reviews`).its('status').should('eq', 200);
  });

  it('15. POST /reviews - Publication d’un avis valide', () => {
    // (OBLIGATOIRE - RECOMMANDÉ PAR MARIE)====================================
    // OBJECTIF
    // =========================================================================
    // Vérifier qu’un utilisateur authentifié peut publier un avis.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - Pouvoir laisser un avis après expérience produit.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Collecte d’avis pour améliorer la confiance et la qualité perçue.
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 200 (ou statut de succès attendu selon implémentation)
    // =========================================================================
    cy.request({
      method: 'POST',
      url: `${apiUrl}/reviews`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { title: 'Top', comment: `Avis auto ${Date.now()}`, rating: 5 }
    }).its('status').should('eq', 200);
  });

  // --------------------------------------------------------------------------
  // SECTION 5 : STOCKS (COMPORTEMENT MÉTIER)
  // --------------------------------------------------------------------------
    it('16. STOCKS - Ajouter un produit en rupture de stock', () => {
    // (OBLIGATOIRE - RECOMMANDÉ PAR MARIE)====================================
    // OBJECTIF MÉTIER
    // =========================================================================
    // Vérifier que l’API refuse l’ajout au panier d’un produit hors stock.
    //
    // Ce test valide une règle métier critique :
    // Un produit dont availableStock <= 0 ne doit jamais être ajoutable.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’utilisateur ne doit pas pouvoir ajouter un produit indisponible.
    // - Même via un appel API direct, l’ajout doit être bloqué.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Empêcher toute commande irréalisable.
    // - Garantir l’intégrité des stocks.
    // - Éviter les incohérences entre stock réel et commandes enregistrées.
    //
    // STRATÉGIE DE PREUVE
    // =========================================================================
    // 1) Lire le produit via GET /products/:id juste avant l’action.
    // 2) Vérifier que availableStock <= 0 au moment du test.
    // 3) Tenter l’ajout via PUT /orders/add.
    //
    // PREUVE ATTENDUE (SI API CONFORME)
    // =========================================================================
    // - HTTP 400 ou 422 (refus explicite).
    //
    // SI LE TEST ÉCHOUE (API retourne 200)
    // =========================================================================
    // => Non-conformité métier backend :
    //    L’API accepte un ajout panier malgré un stock <= 0.
    // ===========================================================================

  if (!outOfStockProductId) {
    cy.log('CT16 => Aucun produit OOS trouvé en base : test non applicable');
    return;
  }

  // 1) PREUVE : vérifier le stock juste avant l’action
  cy.request({
    method: 'GET',
    url: `${apiUrl}/products/${outOfStockProductId}`,
    headers: { Authorization: `Bearer ${authToken}` },
    failOnStatusCode: false
  }).then((pRes) => {

    expect(pRes.status, 'GET /products/:id doit réussir pour prouver le stock')
      .to.eq(200);

    const stockNow = getStock(pRes.body);

    expect(stockNow, 'availableStock doit être lisible (nombre)')
      .to.be.a('number');

    cy.log(`CT16 => Produit ${outOfStockProductId}`);
    cy.log(`CT16 => availableStock actuel = ${stockNow}`);

    // PREUVE MÉTIER : le produit est bien hors stock AU MOMENT DU TEST
    expect(
      stockNow,
      `Précondition métier : stock <= 0 attendu (stock actuel = ${stockNow})`
    ).to.be.at.most(0);

    cy.log('CT16 => Tentative d’ajout panier avec quantity=1 alors que stock <= 0');

    // 2) ACTION : tentative d’ajout
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/orders/add`,
      headers: { Authorization: `Bearer ${authToken}` },
      body: { product: outOfStockProductId, quantity: 1 },
      failOnStatusCode: false
    }).then((res) => {

      cy.log(`CT16 => Réponse API /orders/add = ${res.status}`);

      // Attendu métier : refus obligatoire
      expect(
        res.status,
        'BUG MÉTIER : l’API accepte un ajout panier malgré un stock <= 0'
      ).to.be.oneOf([400, 422]);

    });
  });
});

  it('17. STOCKS - PUT /orders/add avec quantité excessive (contrôlée)', () => {
    // (OBLIGATOIRE - RECOMMANDÉ PAR MARIE)====================================
    // OBJECTIF MÉTIER
    // =========================================================================
    // Vérifier qu’une quantité > stock est refusée côté API.
    //
    // CE QUE JE VEUX VÉRIFIER
    // =========================================================================
    // - L’API applique la règle "pas de quantité supérieure au stock disponible".
    // - Empêche un contournement (même si UI bloque déjà).
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - Même via un appel API, l’utilisateur ne doit pas pouvoir ajouter plus que le stock.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Intégrité du stock.
    // - Évite les commandes impossibles et la dette stock (backorder non prévu).
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 400/422 sur une demande stock+1.
    //
    // NOTE
    // =========================================================================
    // Swagger ne documente pas toujours les erreurs ; on se base donc sur la règle métier.
    // Ce test devient volontairement rouge si l’API accepte la quantité excessive (200).
    // =========================================================================

    cy.request('GET', `${apiUrl}/products/${inStockProductId}`).then((res) => {
      expect(res.status).to.eq(200);

      const currentStock = getStock(res.body);
      expect(currentStock, 'Le stock doit être un nombre').to.be.a('number');

      const excessiveQty = currentStock + 1;

      cy.request({
        method: 'PUT',
        url: `${apiUrl}/orders/add`,
        headers: { Authorization: `Bearer ${authToken}` },
        body: { product: inStockProductId, quantity: excessiveQty },
        failOnStatusCode: false
      }).then((addRes) => {
        expect(addRes.status).to.be.oneOf([400, 422]);
      });
    });
  });

  it('18. ERREUR - GET /products/{id} inexistant (404)', () => {
    // (ALTERNATIF / COMPLEMENTAIRE)===========================================
    // OBJECTIF (ROBUSTESSE / GESTION D’ERREUR)
    // =========================================================================
    // Vérifier que l’API renvoie une erreur correcte pour un produit inexistant.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’application peut afficher une page "produit introuvable" sans crash.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Robustesse face à des URLs invalides (SEO, liens cassés, erreurs de saisie).
    //
    // PREUVE ATTENDUE (SI TEST VERT)
    // =========================================================================
    // - HTTP 404
    // =========================================================================
    cy.request({
      method: 'GET',
      url: `${apiUrl}/products/999999`,
      failOnStatusCode: false
    }).its('status').should('eq', 404);
  });

});