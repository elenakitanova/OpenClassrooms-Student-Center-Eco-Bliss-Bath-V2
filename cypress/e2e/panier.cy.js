// =============================================================================
// TESTS FONCTIONNELS UI — PANIER - ECO BLISS BATH (VERSION AUTOMATISÉE)
// Stratégie : tests indépendants (login UI => actions UI => assertions UI)
// =============================================================================
//
// VISION (BUSINESS + UTILISATEUR) — ce fichier prouve :
// - que le panier fonctionne en parcours nominal (ajout, modification, suppression, checkout)
// - que les règles métier essentielles sont respectées (quantités invalides refusées, plafond qty, validation formulaire)
// - et que l’utilisateur ne peut pas contourner des règles simples via l’UI.
//
// NOTE IMPORTANTE :
// - Les tests "UI only" prouvent le comportement côté utilisateur.
// - Pour la preuve "stock" (quantité > stock), un test hybride API+UI est ajouté en fin de fichier.
//   (car le stock doit être prouvé par une source fiable : availableStock via API).
//

describe('Tests fonctionnels : Panier', () => {
  const firstName = Cypress.env('firstName');
  const lastName = Cypress.env('lastName');
  const address = Cypress.env('address');
  const city = Cypress.env('city');
  const zipCode = Cypress.env('zipCode');

  const apiUrl = Cypress.env('apiUrl'); // utilisé uniquement pour le test stock hybride

  // ---------------------------------------------------------------------------
  // Helpers UI
  // ---------------------------------------------------------------------------
  // Rôle : fonctions utilitaires UI réutilisées dans les tests.
  // Intérêt : limiter la duplication, améliorer la lisibilité, faciliter la maintenance.
  // (si un sélecteur change, la correction se fait à un seul endroit)

const loginUI = () => {
  // Objectif : simuler une connexion utilisateur via l’interface.
  // Attendu (user) : l’utilisateur accède aux fonctionnalités panier.
  // Attendu (business) : un panier est rattaché à une session authentifiée.
  // Obtenu (si test vert) : la navbar est bien mise à jour et la session est active.
  cy.visit('/#/login');

  // IMPORTANT (preuve API) :
  // - cy.request() ne réutilise pas automatiquement le token de l’UI
  // - donc on capture le JWT à la connexion et on le stocke pour les preuves hybrides
  cy.intercept('POST', '**/login').as('login');

  cy.get('[data-cy="login-input-username"]').should('be.visible').type(Cypress.env('userEmail'));
  cy.get('[data-cy="login-input-password"]').type(Cypress.env('userPassword'));
  cy.get('[data-cy="login-submit"]').click();

  cy.wait('@login').then((interception) => {
    const body = interception?.response?.body;

    const token =
      body?.token ||
      body?.accessToken ||
      body?.jwt ||
      body?.data?.token ||
      body?.data?.accessToken;

    // Stockage "source de vérité" pour les cy.request suivants
    if (token) {
      Cypress.env('jwtToken', String(token));
    }
  });

  cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
  cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');
  cy.url().should('not.include', '/login');
};

  const goToProductsList = () => {
    // Objectif : ouvrir la liste des produits.
    // Attendu (user) : accès au catalogue produits.
    // Attendu (business) : l’utilisateur peut naviguer sur le catalogue avant ajout panier.
    // Obtenu (si test vert) : l’URL /products est accessible.
    cy.visit('/#/products');
    cy.url().should('include', '/products');
  };

  const openFirstProductFromList = () => {
    // Objectif : ouvrir une fiche produit depuis la liste.
    // Attendu (user) : accès à la fiche détail (nom + formulaire).
    // Attendu (business) : ajout panier se fait depuis une fiche produit (info produit + quantité).
    // Obtenu (si test vert) : page détail affichée + form d’ajout présent.
    cy.get('[data-cy="product"]').should('exist');
    cy.get('[data-cy="product"]').first().within(() => {
      cy.get('[data-cy="product-link"]').should('be.visible').click();
    });

    cy.get('[data-cy="detail-product-name"]').should('be.visible');
    cy.get('[data-cy="detail-product-form"]').should('exist');
  };

  const setQuantityOnDetail = (qty) => {
    // Objectif : renseigner une quantité sur la fiche produit.
    // Attendu (user) : l’input reflète la quantité saisie / normalisée par l’app.
    // Attendu (business) : la quantité est un paramètre critique (prix, stock, logistique).
    //
    // Note : pas de clear().type() car la page peut changer après ajout (redirection /cart).
    cy.get('[data-cy="detail-product-quantity"]')
      .should('exist')
      .then(($input) => {
        const value = String(qty);
        cy.wrap($input)
          .invoke('val', value)
          .trigger('input', { force: true })
          .trigger('change', { force: true });
      });
  };

  const addToCartFromDetail = () => {
    // Objectif : ajouter le produit au panier depuis la fiche.
    // Attendu (user) : après clic, le panier se met à jour (ou redirection).
    // Attendu (business) : création/modification de la ligne panier correspondant au produit.
    // Obtenu (si test vert sur cas nominal) : une ligne panier apparaît + total visible.
    //
    // Note : le bouton a le même data-cy en mode connecté / non connecté.
    cy.get('[data-cy="detail-product-add"]').should('be.visible').click();
  };

  const goToCart = () => {
    // Objectif : accéder au panier via la navigation.
    // Attendu (user) : accès rapide via la navbar.
    // Attendu (business) : le panier doit être consultable à tout moment après login.
    // Obtenu (si test vert) : URL /cart accessible.
    cy.contains('Mon panier').click();
    cy.url().should('include', '/cart');
  };

  const deleteCartLineAtIndex = (index) => {
    // Objectif : supprimer une ligne panier.
    // Attendu (user) : l’article est retiré immédiatement.
    // Attendu (business) : suppression de la ligne => panier mis à jour + total recalculé.
    // Obtenu (si test vert) : nb de lignes diminue OU panier vide affiché.
    cy.get('[data-cy="cart-line"]').eq(index).within(() => {
      cy.get('[data-cy="cart-line-delete"]').click();
    });
  };

  const clearCartUI = () => {
    // Objectif : remettre le panier à zéro via l’UI (nettoyage entre tests).
    // Attendu (technique) : garantir l’indépendance des tests.
    // Attendu (user) : n/a (helper interne).
    // Obtenu : suppression récursive des lignes si présentes.
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="cart-empty"]').length > 0) return;
      if ($body.find('[data-cy="cart-line"]').length === 0) return;

      const deleteFirstLine = () => {
        cy.get('[data-cy="cart-line-delete"]').first().click({ force: true });
        cy.wait(300);

        cy.get('body').then(($b) => {
          const stillHasLines = $b.find('[data-cy="cart-line"]').length > 0;
          const isEmpty = $b.find('[data-cy="cart-empty"]').length > 0;
          if (stillHasLines && !isEmpty) deleteFirstLine();
        });
      };

      deleteFirstLine();
    });
  };

const getCartStateFromApi = () => {
  expect(apiUrl).to.be.a('string').and.not.be.empty;

  return cy.window().then((win) => {
    const tokenFromEnv = Cypress.env('jwtToken');
    const tokenFromStorage =
      win.localStorage.getItem('token') ||
      win.localStorage.getItem('jwt') ||
      win.localStorage.getItem('access_token') ||
      win.localStorage.getItem('accessToken');

    const token = String(tokenFromEnv || tokenFromStorage || '').replace(/^"|"$/g, '').trim();
    expect(token).to.be.a('string').and.not.be.empty;

    return cy.request({
      method: 'GET',
      url: `${apiUrl}/orders`,
      headers: { Authorization: `Bearer ${token}` },
    });
  }).then((res) => {
    expect(res.status).to.eq(200);
    const body = res.body;

    const rawLines =
      (Array.isArray(body?.lines) && body.lines) ||
      (Array.isArray(body?.orderLines) && body.orderLines) ||
      (Array.isArray(body?.products) && body.products) ||
      (Array.isArray(body?.items) && body.items) ||
      (Array.isArray(body) && body) ||
      [];

    // NORMALISATION (clé)
    const lines = rawLines.map((l) => ({
      productId: l?.product?.id ?? l?.productId ?? l?.id,
      name: l?.product?.name ?? l?.name ?? l?.productName,
      quantity: l?.quantity ?? l?.qty ?? l?.amount ?? l?.productQuantity,
      raw: l,
    }));

    return { raw: body, lines };
  });
};

const getAuthToken = () => {
  // Centralise la récupération du JWT
  expect(apiUrl, 'apiUrl doit être défini').to.be.a('string').and.not.be.empty;

  return cy.window().then((win) => {
    const tokenFromEnv = Cypress.env('jwtToken');
    const tokenFromStorage =
      win.localStorage.getItem('token') ||
      win.localStorage.getItem('jwt') ||
      win.localStorage.getItem('access_token') ||
      win.localStorage.getItem('accessToken');

    const token = String(tokenFromEnv || tokenFromStorage || '').replace(/^"|"$/g, '').trim();
    expect(token, 'JWT doit exister pour appels API').to.be.a('string').and.not.be.empty;
    return token;
  });
};

const resetCartViaApi = () => {
  // Pré-condition BACKEND : panier vide
  return getAuthToken().then((token) => {
    return cy
      .request({
        method: 'GET',
        url: `${apiUrl}/orders`,
        headers: { Authorization: `Bearer ${token}` },
        failOnStatusCode: false,
      })
      .then((res) => {
        // Si 401 : on veut un message clair (sinon tests incompréhensibles)
        expect(res.status, 'GET /orders doit réussir (token OK)').to.eq(200);

        const body = res.body || {};
        const rawLines =
          (Array.isArray(body?.orderLines) && body.orderLines) ||
          (Array.isArray(body?.lines) && body.lines) ||
          [];

        const lineIds = rawLines
          .map((l) => l?.id)
          .filter((id) => typeof id === 'number' || typeof id === 'string');

        if (lineIds.length === 0) {
          cy.log('resetCartViaApi => déjà vide');
          return;
        }

        cy.log(`resetCartViaApi => suppression ${lineIds.length} ligne(s)`);

        // Supprimer toutes les lignes
        return cy
          .wrap(lineIds, { log: false })
          .each((lineId) => {
            cy.request({
              method: 'DELETE',
              url: `${apiUrl}/orders/${lineId}/delete`,
              headers: { Authorization: `Bearer ${token}` },
              failOnStatusCode: false,
            }).then((delRes) => {
              // Selon implémentation : 200 ou 204
              expect([200, 204]).to.include(delRes.status);
            });
          })
          .then(() => {
            // Re-check : doit être vide
            return cy.request({
              method: 'GET',
              url: `${apiUrl}/orders`,
              headers: { Authorization: `Bearer ${token}` },
            });
          })
          .then((finalRes) => {
            expect(finalRes.status).to.eq(200);
            const finalBody = finalRes.body || {};
            const finalLines =
              (Array.isArray(finalBody?.orderLines) && finalBody.orderLines) ||
              (Array.isArray(finalBody?.lines) && finalBody.lines) ||
              [];
            expect(finalLines.length, 'Panier doit être vide après reset API').to.eq(0);
          });
      });
  });
};

const getProductByIdFromApi = (productId) => {
  return getAuthToken().then((token) => {
    return cy.request({
      method: 'GET',
      url: `${apiUrl}/products/${productId}`,
      headers: { Authorization: `Bearer ${token}` },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status, 'GET /products/:id doit réussir').to.eq(200);
      return res.body;
    });
  });
};
  // ---------------------------------------------------------------------------
  // Pré-condition ciblée (UI only) — panier vide pour les tests sensibles
  // ---------------------------------------------------------------------------
beforeEach(function () {
  const title = String(this.currentTest?.title || '');

  const needsCleanCart =
    title.includes('CT11 - Ajouter deux fois le même produit') ||
    title.includes('CT13 - Ajouter 2 produits différents') ||
    title.includes('CT16 - Empêcher l’ajout d’une quantité supérieure au stock') ||
    title.includes('CT17 - Stock décrémente') ||
    title.includes('CT18 - Champ disponibilité visible');

  if (!needsCleanCart) return;

  loginUI();          // récupère le JWT
  resetCartViaApi();  // vide le panier côté backend (preuve)
  cy.visit('/#/cart');

  cy.get('[data-cy="cart-empty"]').should('be.visible');
  cy.get('[data-cy="cart-line"]').should('not.exist');
});

  // ---------------------------------------------------------------------------
  // Nettoyage léger entre tests (UI only)
  // ---------------------------------------------------------------------------
  afterEach(function () {
    // Objectif : garantir l’indépendance des tests (pas d’effet de bord entre it()).
    // Étapes : ouverture /cart puis vidage du panier si nécessaire.
    // Attendu : chaque test démarre avec un panier propre.
    //
    // IMPORTANT (stabilité) :
    // - Si le test vient d’échouer, on ne doit PAS faire tomber toute la suite à cause du afterEach.
    // - Donc : si currentTest = failed => on log et on skip le nettoyage.
    if (this.currentTest && this.currentTest.state === 'failed') {
      cy.log('afterEach : test failed => skip cleanup pour ne pas bloquer la suite');
      return;
    }

    cy.visit('/#/cart');

    // Sécurisation : s'assurer que le document est bien chargé.
    cy.document({ timeout: 15000 }).its('readyState').should('eq', 'complete');

    // Sécurisation : on récupère le body via document (plus robuste que cy.get('body') si la page est instable)
    cy.document().then((doc) => {
      const $body = Cypress.$(doc.body);

      const hasCartEmpty = $body.find('[data-cy="cart-empty"]').length > 0;
      const hasCartLines = $body.find('[data-cy="cart-line"]').length > 0;

      if (!hasCartEmpty && !hasCartLines) return;

      clearCartUI();
    });
  });

  // ---------------------------------------------------------------------------
  // CT01 - Accès panier après connexion
  // ---------------------------------------------------------------------------
  it('CT01 - Accès à la page panier après connexion', () => {
    // Objectif : vérifier l’accès au panier pour un utilisateur connecté.
    // Attendu (user) : l’utilisateur peut ouvrir "Mon panier" sans erreur.
    // Attendu (business) : le panier est une donnée utilisateur => accès autorisé après login.
    // Obtenu (si test vert) : page panier affichée (vide ou avec lignes).
    loginUI();
    goToCart();

    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="cart-empty"]').length > 0) {
        cy.get('[data-cy="cart-empty"]').should('be.visible');
      } else {
        cy.get('[data-cy="cart-line"]').should('have.length.greaterThan', 0);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CT02 - Ajouter un produit au panier depuis la fiche produit
  // ---------------------------------------------------------------------------
  it('CT02 - Ajouter un produit au panier (quantité 1) depuis une fiche produit', () => {
    // Objectif : valider le flux nominal d’ajout au panier.
    // Attendu (user) : après ajout, le panier contient l’article.
    // Attendu (business) : création de ligne panier + total calculé.
    // Obtenu (si test vert) : au moins une ligne panier + total visible.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();
    cy.get('[data-cy="cart-line"]').should('have.length.greaterThan', 0);
    cy.get('[data-cy="cart-total"]').should('be.visible');
  });

  // ---------------------------------------------------------------------------
  // CT03 - Vérifier que la ligne panier contient nom, description, quantité, total ligne
  // ---------------------------------------------------------------------------
  it('CT03 - Vérifier les informations affichées sur une ligne panier', () => {
    // Objectif : contrôler l’affichage minimum d’une ligne panier.
    // Attendu (user) : retrouver les infos essentielles (produit, quantité, prix, action supprimer).
    // Attendu (business) : transparence du calcul de prix + possibilité de modifier/supprimer.
    // Obtenu (si test vert) : champs UI visibles + total global visible.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();

    cy.get('[data-cy="cart-line"]').first().within(() => {
      cy.get('[data-cy="cart-line-image"]').should('be.visible');
      cy.get('[data-cy="cart-line-name"]').should('be.visible');
      cy.get('[data-cy="cart-line-description"]').should('be.visible');
      cy.get('[data-cy="cart-line-quantity"]').should('be.visible');
      cy.get('[data-cy="cart-line-total"]').should('be.visible');
      cy.get('[data-cy="cart-line-delete"]').should('be.visible');
    });

    cy.get('[data-cy="cart-total"]').should('be.visible');
  });

  // ---------------------------------------------------------------------------
  // CT04 - Modifier la quantité depuis le panier (input quantité)
  // ---------------------------------------------------------------------------
  it('CT04 - Modifier la quantité d’un produit depuis le panier', () => {
    // Objectif : vérifier la modification de quantité depuis le panier.
    // Attendu (user) : l’input change réellement et reste stable à l’écran.
    // Attendu (business) : le panier doit recalculer les montants et rester cohérent.
    // Obtenu (si test vert) : qty passe de X à 2 + API change-quantity répond 200 + total visible.
    //
    // Observé :
    // - Sur ce projet, l’input quantité peut être piloté par Angular (ngModel).
    // - Un simple type() peut être “écrasé” par le binding / le retour API, et conduire à des valeurs comme "21".
    // => Donc on force la valeur comme sur la fiche produit (invoke val + trigger input/change)
    //    et on attend la requête change-quantity pour stabiliser le résultat.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();

    // Synchronisation réseau : on attend le PUT change-quantity déclenché par la modif UI
    cy.intercept('PUT', '**/orders/*/change-quantity').as('changeQty');

    cy.get('[data-cy="cart-line"]').first().within(() => {
      cy.get('[data-cy="cart-line-quantity"]')
        .should('be.visible')
        .invoke('val')
        .then((beforeVal) => {
          // Force la valeur (approche robuste, identique à ta fiche produit)
          cy.get('[data-cy="cart-line-quantity"]').then(($input) => {
            cy.wrap($input)
              .invoke('val', '2')
              .trigger('input', { force: true })
              .trigger('change', { force: true });
          });

          // Attendre que l’API ait bien reçu la nouvelle quantité (stabilisation)
          cy.wait('@changeQty').its('response.statusCode').should('eq', 200);

          // Assertion stricte : la valeur affichée doit être "2" (et différente de before)
          cy.get('[data-cy="cart-line-quantity"]')
            .invoke('val')
            .should((afterVal) => {
              expect(String(afterVal)).to.eq('2');
              expect(String(afterVal)).to.not.eq(String(beforeVal));
            });
        });
    });

    // Indicateur global : le total panier doit toujours être visible
    cy.get('[data-cy="cart-total"]').should('be.visible');
  });

  // ---------------------------------------------------------------------------
  // CT05 - Supprimer une ligne panier
  // ---------------------------------------------------------------------------
  it('CT05 - Supprimer un produit du panier', () => {
    // Objectif : vérifier la suppression d’un article depuis le panier.
    // Attendu (user) : pouvoir retirer un produit.
    // Attendu (business) : recalcul du panier + suppression de la ligne.
    // Obtenu (si test vert) : nb de lignes diminue OU cart-empty affiché.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();

    cy.get('[data-cy="cart-line"]').then(($linesBefore) => {
      const beforeCount = $linesBefore.length;

      deleteCartLineAtIndex(0);

      if (beforeCount === 1) {
        cy.get('[data-cy="cart-empty"]').should('be.visible');
      } else {
        cy.get('[data-cy="cart-line"]').should('have.length', beforeCount - 1);
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CT06 - Valider une commande (formulaire complet + bouton valider)
  // ---------------------------------------------------------------------------
  it('CT06 - Valider une commande depuis le panier', () => {
    // Objectif : valider le parcours nominal checkout.
    // Attendu (user) : après soumission, l’utilisateur voit une confirmation.
    // Attendu (business) : une commande est créée (preuve UI ici = confirmation affichée).
    // Obtenu (si test vert) : "Merci !" + "Votre commande est bien validée" visibles.
    //
    // NOTE :
    // - Ce test prouve la vision utilisateur (UI).
    // - La preuve "commande réellement enregistrée côté backend" se fait via test API (déjà présent dans ton fichier API).
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();

    cy.get('[data-cy="cart-form"]').should('exist');

    cy.get('[data-cy="cart-input-lastname"]').should('be.visible').clear().type(lastName);
    cy.get('[data-cy="cart-input-firstname"]').clear().type(firstName);
    cy.get('[data-cy="cart-input-address"]').clear().type(address);
    cy.get('[data-cy="cart-input-zipcode"]').clear().type(zipCode);
    cy.get('[data-cy="cart-input-city"]').clear().type(city);

    cy.get('[data-cy="cart-submit"]').should('be.visible').click();

    cy.contains('Merci !', { timeout: 15000 }).should('be.visible');
    cy.contains('Votre commande est bien validée', { timeout: 15000 }).should('be.visible');
  });

  // ---------------------------------------------------------------------------
  // CT07 - Quantité négative sur la fiche produit
  // ---------------------------------------------------------------------------
  it('CT07 - Empêcher une quantité négative sur la fiche produit', () => {
    // Objectif : vérifier qu’une quantité invalide (négative) est refusée.
    // Attendu (user) : impossible d’ajouter au panier avec qty négative.
    // Attendu (business) : une quantité doit être >= 1 (sinon calcul prix/stock incohérent).
    // Obtenu (si test vert) : panier reste vide (cart-empty) + aucune ligne.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(-1);

    // Vérif UI : la valeur affichée doit être un nombre (au minimum)
    cy.get('[data-cy="detail-product-quantity"]')
      .invoke('val')
      .then((val) => {
        const numeric = Number(val);
        expect(Number.isNaN(numeric)).to.eq(false);
      });

    addToCartFromDetail();
    goToCart();

    // STRICT : panier doit rester vide (refus obligatoire)
    cy.get('[data-cy="cart-empty"]').should('be.visible');
    cy.get('[data-cy="cart-line"]').should('not.exist');
  });

  // ---------------------------------------------------------------------------
  // CT08 - Quantité très grande (21) sur la fiche produit
  // ---------------------------------------------------------------------------
  it('CT08 - Empêcher une quantité > 20 sur la fiche produit', () => {
    // Objectif : vérifier la règle métier "plafond quantité" côté UI.
    // IMPORTANT : ce test ne prouve PAS le stock. Il prouve une limite de quantité par produit (anti abus / logistique).
    //
    // Étapes : fiche produit => qty=21 => ajout => panier.
    // Attendu (user) : l’app refuse une quantité trop grande.
    // Attendu (business) : si qty > 20 => refus obligatoire (règle A choisie).
    // Obtenu (si test vert) : panier vide + aucune ligne => l’app bloque réellement l’ajout > 20 sur ce parcours UI.
    //
    // Idéal UX : message d’erreur, mais on ne dépend pas d’un libellé (fragile).
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(21);

    addToCartFromDetail();
    goToCart();

    // STRICT (Règle A — Refus strict) : panier vide obligatoire
    cy.get('[data-cy="cart-empty"]').should('be.visible');
    cy.get('[data-cy="cart-line"]').should('not.exist');

    // Optionnel (si un message existe) : non-bloquant, donc pas fragile.
    cy.get('body').then(($body) => {
      const hasPotentialMsg =
        $body.text().match(/quantit|limite|max|invalide|erreur|incorrect/i) !== null;
      if (hasPotentialMsg) {
        cy.contains(/quantit|limite|max|invalide|erreur|incorrect/i).should('be.visible');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CT09 - Quantité =0 sur la fiche produit
  // ---------------------------------------------------------------------------
  it('CT09 - Empêcher une quantité = 0 sur la fiche produit', () => {
    // Objectif : vérifier qu’une quantité nulle est refusée.
    // Attendu (user) : qty=0 ne doit pas être ajoutable.
    // Attendu (business) : une quantité doit être >= 1 (sinon panier incohérent).
    // Obtenu (si test vert) : panier vide + aucune ligne.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(0);
    addToCartFromDetail();
    goToCart();

    // STRICT : panier vide obligatoire
    cy.get('[data-cy="cart-empty"]').should('be.visible');
    cy.get('[data-cy="cart-line"]').should('not.exist');
  });

  // ---------------------------------------------------------------------------
  // CT10 - Quantité décimale sur la fiche produit (STRICT)
  // ---------------------------------------------------------------------------
  it('CT10 - Empêcher une quantité décimale (1.5) sur la fiche produit', () => {
    // Objectif : vérifier qu’une quantité décimale est refusée.
    // Attendu (user) : qty décimale => refus (pas de panier "1.5 article").
    // Attendu (business) : quantité entière uniquement (stock, logistique, facturation).
    // Obtenu (si test vert) : panier vide + aucune ligne.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1.5);
    addToCartFromDetail();
    goToCart();

    // STRICT : panier vide obligatoire
    cy.get('[data-cy="cart-empty"]').should('be.visible');
    cy.get('[data-cy="cart-line"]').should('not.exist');
  });

  // ---------------------------------------------------------------------------
  // CT11 - Ajout doublon (merge)
  // ---------------------------------------------------------------------------
  it('CT11 - Ajouter deux fois le même produit => merge en une ligne (quantité cumulée)', () => {
    // Objectif : vérifier la gestion "doublon" côté UI.
    // Attendu (user) : si j’ajoute 2 fois le même produit => je le retrouve regroupé.
    // Attendu (business) : règle panier standard e-commerce :
    // - une seule ligne par produit
    // - quantité cumulée (ici 1 + 1 => 2)
    // Obtenu (si test vert) :
    // - 1 seule ligne correspondante
    // - quantité affichée = 2
    //
    // IMPORTANT (robustesse) :
    // - On ajoute une preuve "pré-clic" : l’input quantité DOIT valoir "1" avant chaque ajout.
    // - Sinon, le test ne prouve pas le métier (l’app peut "normaliser" ou "hériter" une valeur).
    //
    // IMPORTANT (preuve) :
    // - Si l’UI affiche une quantité incohérente (ex: 23), on tranche avec une preuve API.
    // - Cela évite un faux négatif si le backend est correct mais l’affichage UI est buggué.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    cy.get('[data-cy="detail-product-name"]').invoke('text').then((productName) => {
      const name = String(productName).trim();

      cy.location('hash').then((hash) => {
        const productHashUrl = String(hash);

        // Ajout 1 (qty=1) — preuve pré-clic
        setQuantityOnDetail(1);
        cy.get('[data-cy="detail-product-quantity"]').invoke('val').should('eq', '1');
        addToCartFromDetail();

        // Si redirection vers /cart, on revient sur la fiche produit pour faire le 2e ajout
        cy.location('hash').then((hashAfterFirstAdd) => {
          const after = String(hashAfterFirstAdd);

          if (after.includes('/cart')) {
            cy.visit(`/${productHashUrl}`);
            cy.get('[data-cy="detail-product-name"]').should('be.visible');
          }

          // Ajout 2 (qty=1) — preuve pré-clic
          setQuantityOnDetail(1);
          cy.get('[data-cy="detail-product-quantity"]').invoke('val').should('eq', '1');
          addToCartFromDetail();

          // Aller au panier si pas déjà redirigé
          cy.location('hash').then((h) => {
            if (!String(h).includes('/cart')) {
              goToCart();
            }
          });

          // Preuve UI minimale : panier non vide + total visible
          cy.get('[data-cy="cart-empty"]').should('not.exist');
          cy.get('[data-cy="cart-total"]').should('be.visible');

          // Preuve API (source de vérité) : une seule ligne pour ce produit + qty = 2
          getCartStateFromApi().then(({ lines, raw }) => {
            cy.log(`CT11 (API) => lignes=${lines.length}`);
            cy.log(`CT11 (API raw) => ${JSON.stringify(raw).slice(0, 500)}`);

            // Tolérant sur la structure : on cherche le produit par "name" si présent, sinon par "productId"
            const matching = lines.filter((l) => {
              const lineName = String(l?.name || l?.productName || '').trim();
              return lineName && lineName.includes(name);
            });

            // Si l’API ne fournit pas de "name", on retombe sur une approche fallback (1 ligne attendue au minimum)
            if (matching.length === 0) {
              // Fallback : au moins 1 ligne dans le panier (preuve panier non vide côté backend)
              expect(lines.length, 'Panier API non vide').to.be.greaterThan(0);
              cy.log('CT11 (API) => impossible de matcher par nom (structure différente), vérifie la réponse /orders');
              return;
            }

            expect(matching.length, `Nombre de lignes API correspondant au produit "${name}"`).to.eq(1);

            const qty =
              matching[0]?.quantity ??
              matching[0]?.qty ??
              matching[0]?.productQuantity ??
              matching[0]?.amount;

            expect(qty, 'Quantité doit être lisible via API').to.not.eq(undefined);
            expect(Number(qty), 'Quantité API (numérique)').to.eq(2);
          });
        });
      });
    });
  });

  // ---------------------------------------------------------------------------
  // CT12 - Accès /cart sans login
  // ---------------------------------------------------------------------------
  it('CT12 - Interdire l’accès /cart sans login (redirection /login)', () => {
    // Objectif : vérifier la règle d’accès au panier sans authentification.
    // Attendu (user) : si je ne suis pas connecté, je suis redirigé vers login.
    // Attendu (business) : le panier est une donnée utilisateur => accès protégé.
    // Obtenu (si test vert) : hash contient /login.
    cy.visit('/#/cart');
    cy.location('hash').should('include', '/login');
  });

  
  // ===========================================================================
  // CT13 — Ajouter 2 produits différents au panier
  // ===========================================================================
  it('CT13 - Ajouter 2 produits différents au panier', () => {
  // OBJECTIF (fonctionnel)
  // Vérifier qu’un utilisateur connecté peut ajouter deux produits DISTINCTS au panier.
  //
  // CE QUE JE VEUX TESTER (parcours)
  // 1) Ouvrir une fiche produit (Produit A) et l’ajouter au panier en quantité 1.
  // 2) Ouvrir une autre fiche produit (Produit B, ID différent) et l’ajouter au panier en quantité 1.
  // 3) Vérifier côté UI que le panier n’est pas vide et que le total s’affiche.
  // 4) Vérifier côté API (source de vérité /orders) que le panier contient 2 produits distincts
  //    via leurs identifiants (productId).
  //
  // ATTENDU CÔTÉ USER
  // - Après les ajouts : panier non vide
  // - Total panier visible
  //
  // ATTENDU CÔTÉ BUSINESS
  // - Un panier e-commerce doit accepter plusieurs produits simultanément.
  // - Deux produits différents => 2 productId distincts dans la commande (API /orders).
  //
  // ÉTAT OBTENU (preuve si test vert)
  // - UI : cart-empty absent + cart-total visible
  // - API : Set(productId).size = 2 et contient les IDs des deux produits ajoutés
  //
  // NOTE (stabilité)
  // - On ne dépend pas des NOMS produits (peuvent être identiques/normalisés).
  // - On prouve le besoin métier via les IDs (productId), plus fiable.
  // ===========================================================================

  // ---------------------------------------------------------------------------
  // Précondition
  // ---------------------------------------------------------------------------
  // Objectif : démarrer sur une session authentifiée.
  // Attendu (user) : accès aux pages produits / panier.
  // Attendu (business) : panier rattaché à une session utilisateur.
  // Obtenu : login OK (navbar mise à jour).
  loginUI();

  // ---------------------------------------------------------------------------
  // Helper : extraire un productId depuis le hash "#/products/:id"
  // ---------------------------------------------------------------------------
  // Objectif : obtenir une donnée stable pour prouver que les produits sont distincts.
  // Attendu (technique) : hash contient "/products/<id>".
  // Obtenu : productId numérique exploitable en assertion API.
  const getProductIdFromHash = () => {
    return cy.location('hash').then((hash) => {
      const match = String(hash).match(/\/products\/(\d+)/);
      expect(match, `Impossible d'extraire productId depuis le hash: ${hash}`).to.not.eq(null);

      const id = Number(match[1]);
      expect(Number.isNaN(id), 'productId extrait doit être un nombre valide').to.eq(false);

      return id;
    });
  };

  // ---------------------------------------------------------------------------
  // Helper : vérifier qu'une page produit est bien chargée
  // ---------------------------------------------------------------------------
  // Objectif : s’assurer que la navigation vers la fiche produit a réussi.
  // Attendu (user) : voir le nom du produit + formulaire d’ajout.
  // Attendu (business) : le produit est consultable.
  // Obtenu : éléments data-cy présents.
  const assertProductPageLoaded = () => {
    cy.get('[data-cy="detail-product-name"]', { timeout: 15000 }).should('be.visible');
    cy.get('[data-cy="detail-product-form"]').should('exist');
  };

  // ---------------------------------------------------------------------------
  // 1) Ouvrir le produit A depuis la liste et l’ajouter (qty=1)
  // ---------------------------------------------------------------------------
  // Objectif : réaliser un premier ajout nominal.
  // Attendu (user) : l’ajout est accepté.
  // Attendu (business) : une ligne/entrée de commande est créée/augmentée.
  // Obtenu : PUT /orders/add répond 200.
  goToProductsList();
  openFirstProductFromList();
  assertProductPageLoaded();

  getProductIdFromHash().then((p1Id) => {
    cy.log(`CT13 => p1Id=${p1Id}`);

    setQuantityOnDetail(1);
    cy.get('[data-cy="detail-product-quantity"]').invoke('val').should('eq', '1');

    cy.intercept('PUT', '**/orders/add').as('addProduct1');
    addToCartFromDetail();
    cy.wait('@addProduct1').its('response.statusCode').should('eq', 200);

    // -------------------------------------------------------------------------
    // 2) Ouvrir le produit B (ID différent) + l’ajouter (qty=1)
    // -------------------------------------------------------------------------
    // Objectif : garantir un produit différent (preuve par l’ID).
    // Stratégie : tenter p1Id+1 ; si l’ID est le même ou invalide, fallback sur p1Id+2.
    //
    // Attendu (user) : pouvoir ajouter un 2e produit.
    // Attendu (business) : panier multi-produits.
    // Obtenu : second ajout API 200 + présence de 2 IDs distincts dans /orders.
    const p2Candidate1 = p1Id + 1;
    const p2Candidate2 = p1Id + 2;

    // On tente d’abord candidate1.
    cy.visit(`/#/products/${p2Candidate1}`);
    assertProductPageLoaded();

    getProductIdFromHash().then((maybeP2Id) => {
      // Si pour une raison quelconque l’app renvoie le même ID (ou redirection),
      // on bascule sur candidate2 (sans catch, juste avec un if Cypress).
      cy.then(() => {
        if (Number(maybeP2Id) === Number(p1Id)) {
          cy.log(`CT13 => candidate1 renvoie le même ID (${maybeP2Id}), fallback vers ${p2Candidate2}`);
          cy.visit(`/#/products/${p2Candidate2}`);
          assertProductPageLoaded();
          return getProductIdFromHash();
        }
        return maybeP2Id;
      }).then((p2Id) => {
        expect(Number(p2Id), 'p2Id doit être différent de p1Id').to.not.eq(Number(p1Id));
        cy.log(`CT13 => p2Id=${p2Id}`);

        setQuantityOnDetail(1);
        cy.get('[data-cy="detail-product-quantity"]').invoke('val').should('eq', '1');

        cy.intercept('PUT', '**/orders/add').as('addProduct2');
        addToCartFromDetail();
        cy.wait('@addProduct2').its('response.statusCode').should('eq', 200);

        // ---------------------------------------------------------------------
        // 3) Preuve UI minimale : panier non vide + total visible
        // ---------------------------------------------------------------------
        // Objectif : prouver le comportement côté utilisateur.
        // Attendu (user) : le panier reflète les ajouts.
        // Attendu (business) : total disponible pour le checkout.
        // Obtenu : cart-empty absent + cart-total visible.
        cy.location('hash').then((h) => {
          if (!String(h).includes('/cart')) {
            goToCart();
          }
        });

        cy.get('[data-cy="cart-empty"]').should('not.exist');
        cy.get('[data-cy="cart-total"]').should('be.visible');

        // ---------------------------------------------------------------------
        // 4) Preuve API : 2 produits distincts (IDs) dans /orders
        // ---------------------------------------------------------------------
        // Objectif : prouver l’exigence métier avec une source fiable (API).
        // Attendu (business) : 2 produits différents => 2 productId distincts.
        // Attendu (user) : ses 2 ajouts sont bien pris en compte côté système.
        // Obtenu : Set(ids).size == 2 et contient p1Id + p2Id.
        getCartStateFromApi().then(({ lines, raw }) => {
          cy.log(`CT13 (API) => lignes=${lines.length}`);
          cy.log(`CT13 (API raw) => ${JSON.stringify(raw).slice(0, 500)}`);

          const ids = lines.map(l => Number(l.productId)).filter(Boolean);
          expect(new Set(ids).size, '2 produits distincts (IDs) dans le panier').to.eq(2);

          expect(ids, 'Le panier doit contenir le produit 1 (p1Id) via API').to.include(Number(p1Id));
          expect(ids, 'Le panier doit contenir le produit 2 (p2Id) via API').to.include(Number(p2Id));
        });
      });
    });
  });
});

  // ---------------------------------------------------------------------------
  // CT14 - Checkout champs vides (validation formulaire)
  // ---------------------------------------------------------------------------
  it('CT14 - Empêcher le checkout si champs vides (validation)', () => {
    // Objectif : vérifier que le formulaire empêche la validation si champs requis vides.
    // Attendu (user) : impossible de passer commande si formulaire incomplet.
    // Attendu (business) : aucune commande ne doit être créée sans données client minimales.
    //
    // Stricte mais robuste UI :
    // - le form reste invalide (ng-invalid)
    // - on reste sur /cart
    // - aucune confirmation "Merci !" n’apparaît
    //
    // Obtenu (si test vert) : le contrat UI est respecté (blocage checkout).
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();

    cy.get('[data-cy="cart-form"]').should('exist');

    // On force le vidage + blur pour déclencher la validation Angular
    cy.get('[data-cy="cart-input-lastname"]').should('be.visible').clear().blur();
    cy.get('[data-cy="cart-input-firstname"]').clear().blur();
    cy.get('[data-cy="cart-input-address"]').clear().blur();
    cy.get('[data-cy="cart-input-zipcode"]').clear().blur();
    cy.get('[data-cy="cart-input-city"]').clear().blur();

    // Pré-condition stricte : au moins un champ doit être en ng-invalid (sinon la validation UI ne fonctionne pas)
    cy.get('[data-cy="cart-form"]').within(() => {
      cy.get('.ng-invalid').should('exist');
    });

    // Tentative de soumission
    cy.get('[data-cy="cart-submit"]').should('be.visible').click();

    // Strict : pas de confirmation + rester sur /cart
    cy.contains('Merci !', { timeout: 2000 }).should('not.exist');
    cy.contains('Votre commande est bien validée', { timeout: 2000 }).should('not.exist');

    cy.location('hash').then((hash) => {
      cy.log(`CT14 => hash actuel après submit champs vides: ${hash}`);
      expect(String(hash)).to.include('/cart');
    });

    // Strict : le formulaire doit rester invalide après submit (sinon il a été accepté / nettoyé à tort)
    cy.get('[data-cy="cart-form"]').within(() => {
      cy.get('.ng-invalid').should('exist');
    });
  });

  // ---------------------------------------------------------------------------
  // CT15 - Persistance du panier après refresh (observation)
  // ---------------------------------------------------------------------------
  it('CT15 - Observer la persistance du panier après refresh', () => {
    // Objectif : vérifier la persistance du panier après rechargement.
    // Attendu (user) : l’état panier reste cohérent après refresh.
    // Attendu (business) : selon règle produit (persistant ou non) => pas de comportement incohérent.
    // Obtenu : on logge avant/après + on vérifie affichage cohérent.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();

    cy.get('body').then(($body) => {
      const wasEmpty = $body.find('[data-cy="cart-empty"]').length > 0;
      const beforeLines = $body.find('[data-cy="cart-line"]').length;

      cy.log(`CT15 (avant reload) => empty: ${wasEmpty}, lines: ${beforeLines}`);

      cy.reload();

      cy.get('body').then(($body2) => {
        const isEmptyAfter = $body2.find('[data-cy="cart-empty"]').length > 0;
        const afterLines = $body2.find('[data-cy="cart-line"]').length;

        cy.log(`CT15 (après reload) => empty: ${isEmptyAfter}, lines: ${afterLines}`);

        if (isEmptyAfter) {
          cy.get('[data-cy="cart-empty"]').should('be.visible');
        } else {
          cy.get('[data-cy="cart-line"]').should('have.length.greaterThan', 0);
          cy.get('[data-cy="cart-total"]').should('be.visible');
        }

        const persisted = beforeLines === afterLines && wasEmpty === isEmptyAfter;
        cy.log(`CT15 => panier persistant ? ${persisted}`);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // CT16 - STOCK (preuve hybride API + UI) : refuser qty > availableStock
  // ---------------------------------------------------------------------------
  it('CT16 - Empêcher l’ajout d’une quantité supérieure au stock disponible (preuve API + UI)', () => {
    // Objectif : prouver une règle stock (métier) de manière fiable.
    //
    // Méthode hybride 
    // - Le stock visible en UI peut ne pas exister ou être incomplet.
    // - Pour prouver "qty > stock", il faut une source de vérité : l’API expose availableStock.
    //
    // Étapes (preuve) :
    // 1) API : GET /products => choisir un produit avec availableStock > 0
    // 2) UI : ouvrir la fiche du produit (par son id)
    // 3) saisir qty = availableStock + 1
    // 4) tenter ajout panier
    //
    // Attendu (user) : message / blocage ; panier ne doit pas contenir l’article en quantité excédentaire.
    // Attendu (business) : impossible de commander plus que le stock disponible.
    //
    // Obtenu (si test vert) :
    // - on a bien prouvé stock = X via API (log)
    // - et l’UI refuse l’ajout (panier vide ou aucune ligne ajoutée).
    //
    // NOTE : si ton métier autorise "backorder" (commande malgré stock) alors ce test devra être adapté.
    expect(apiUrl, 'apiUrl doit être défini pour CT16').to.be.a('string').and.not.be.empty;

    // 1) Récupérer un produit en stock via l’API (availableStock > 0)
    cy.request('GET', `${apiUrl}/products`).then((res) => {
      expect(res.status).to.eq(200);
      const products = Array.isArray(res.body) ? res.body : [];
      expect(products.length, 'La liste produits ne doit pas être vide').to.be.greaterThan(0);

      const inStock = products.find((p) => typeof p?.availableStock === 'number' && p.availableStock > 0);
      expect(inStock, 'Doit trouver au moins un produit avec availableStock > 0').to.exist;

      const productId = inStock.id;
      const stock = inStock.availableStock;

      cy.log(`CT16 => produitId=${productId} | availableStock=${stock}`);

      // 2) UI : login + ouvrir la fiche du produit par ID
      loginUI();
      cy.visit(`/#/products/${productId}`);
      cy.get('[data-cy="detail-product-name"]').should('be.visible');

      // 3) qty = stock + 1
      const excessiveQty = stock + 1;
      cy.log(`CT16 => tentative qty=${excessiveQty} (stock+1)`);

      setQuantityOnDetail(excessiveQty);

      // 4) tentative ajout + vérifier refus
      addToCartFromDetail();
      goToCart();

      // STRICT : on refuse l’ajout excédentaire (panier vide)
      cy.get('[data-cy="cart-empty"]').should('be.visible');
      cy.get('[data-cy="cart-line"]').should('not.exist');
    });
  });

// ---------------------------------------------------------------------------
// CT17 - STOCK décrémente après ajout (preuve API + UI)
// ---------------------------------------------------------------------------
it('CT17 - Stock décrémente après ajout au panier (preuve API + UI)', () => {
  // Objectif : Vérifier qu’un ajout au panier provoque une décrémentation réelle du stock
  // du produit concerné.
  //
  // Ce test ne valide pas seulement l’affichage UI, mais la cohérence métier
  // du système (gestion des stocks).
  //
  // Vérifier : 
  // - Que le backend diminue bien availableStock lorsqu’un produit est ajouté.
  // - Que cette décrémentation est mesurable via l’API (source de vérité).
  // - Que l’action utilisateur (ajout panier via UI) déclenche réellement
  //   une modification persistée côté serveur.
  //
  // Attendu côté user : 
  // - L’utilisateur peut ajouter un produit au panier.
  // - Le panier n’est pas vide après ajout.
  // - Le système prend en compte son action.
  //
  // Attendu côté business / métier : 
  // - Le stock disponible doit diminuer immédiatement après un ajout panier.
  // - Le stock est une donnée critique (logistique, disponibilité, ventes).
  // - Une décrémentation incorrecte créerait des surventes ou incohérences.
  //
  // Preuve Attendue (SI TEST VERT) : 
  // - stockBefore récupéré via API.
  // - stockAfter récupéré via API.
  // - Vérification stricte : stockAfter = stockBefore - 1.
  //
  // Stratégie technique : 
  // Mode hybride (UI + API) :
  // - L’UI déclenche l’action métier réelle (PUT /orders/add).
  // - L’API fournit la preuve fiable (lecture /products/:id).
  //
  // Cela permet d’éviter :
  // - Les faux positifs liés à un simple affichage.
  // - Les erreurs d’interprétation côté front.

  expect(apiUrl, 'apiUrl doit être défini pour CT17').to.be.a('string').and.not.be.empty;

  // Précondition backend : panier vide (évite un décrément déjà “consommé”)
  loginUI();
  resetCartViaApi();

  // 1) Choisir un produit avec stock > 1
  cy.request('GET', `${apiUrl}/products`).then((res) => {
    expect(res.status).to.eq(200);
    const products = Array.isArray(res.body) ? res.body : [];
    expect(products.length, 'La liste produits ne doit pas être vide').to.be.greaterThan(0);

    const candidate = products.find(
      (p) => typeof p?.availableStock === 'number' && p.availableStock > 1
    );
    expect(candidate, 'Doit trouver un produit avec availableStock > 1').to.exist;

    const productId = candidate.id;

    // 2) Lire stockBefore via API “source de vérité”
    getProductByIdFromApi(productId).then((pBefore) => {
      const stockBefore = pBefore?.availableStock;
      expect(stockBefore, 'availableStock (before) doit être un nombre').to.be.a('number');

      cy.log(`CT17 => productId=${productId} | stockBefore=${stockBefore}`);

      // 3) UI : ajouter qty=1
      cy.visit(`/#/products/${productId}`);
      cy.get('[data-cy="detail-product-name"]').should('be.visible');

      setQuantityOnDetail(1);
      cy.get('[data-cy="detail-product-quantity"]').invoke('val').should('eq', '1');

      // On attend le PUT /orders/add pour s’assurer que l’ajout est bien parti
      cy.intercept('PUT', '**/orders/add').as('addToCart');
      addToCartFromDetail();
      cy.wait('@addToCart').its('response.statusCode').should('eq', 200);

      // Preuve UI minimale : panier non vide (au moins une ligne)
      goToCart();
      cy.get('[data-cy="cart-empty"]').should('not.exist');
      cy.get('[data-cy="cart-line"]').should('have.length.greaterThan', 0);

      // 4) Relire stockAfter via API
      getProductByIdFromApi(productId).then((pAfter) => {
        const stockAfter = pAfter?.availableStock;
        expect(stockAfter, 'availableStock (after) doit être un nombre').to.be.a('number');

        cy.log(`CT17 => stockAfter=${stockAfter}`);

        expect(
          stockAfter,
          `Le stock doit décrémenter de 1 (before=${stockBefore}, after=${stockAfter})`
        ).to.eq(stockBefore - 1);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// CT18 - Champ disponibilité visible sur la fiche produit
// ---------------------------------------------------------------------------
it('CT18 - Champ disponibilité (stock) visible sur la fiche produit', () => {
    // Objectif : Vérifier que la fiche produit affiche une information de disponibilité
  // (stock ou état disponible).
  //
  // Vérifier : 
  // - La présence d’un indicateur de disponibilité sur la fiche produit.
  // - La visibilité effective de cette information pour l’utilisateur.
  //
  // Attendu côté user : 
  // - L’utilisateur doit pouvoir savoir immédiatement si le produit est disponible.
  // - L’information doit être visible sans action supplémentaire.
  //
  // Attendu côté business / métier :
  // - Transparence sur la disponibilité des produits.
  // - Réduction du risque de frustration (tentative d’achat impossible).
  // - Respect des standards e-commerce en matière d’information produit.
  //
  // Preuve attendue (SI TEST VERT) :
  // - Présence d’un élément dédié à la disponibilité (data-cy recommandé).
  // - À défaut, présence explicite d’un libellé indiquant le stock ou la disponibilité.
  //
  // La vérification privilégie un sélecteur stable (data-cy) lorsqu’il existe,
  // tout en garantissant une couverture fonctionnelle complète.

  loginUI();
  goToProductsList();
  openFirstProductFromList();

  // Option A : data-cy (le plus stable si ton app l’a)
  const selectors = [
    '[data-cy="detail-product-availability"]',
    '[data-cy="detail-product-stock"]',
    '[data-cy="detail-product-availableStock"]',
    '[data-cy="product-availability"]',
    '[data-cy="product-stock"]',
  ];

  cy.get('body').then(($body) => {
    const hasAnyDataCy = selectors.some((sel) => $body.find(sel).length > 0);

    if (hasAnyDataCy) {
      const found = selectors.find((sel) => $body.find(sel).length > 0);
      cy.get(found).should('be.visible');
      return;
    }

    // Option B : fallback texte (moins stable, mais couvre l’exigence Marie)
    cy.contains(/disponibilit|stock|en stock|disponible/i).should('be.visible');
  });
});
});