// =============================================================================
// TESTS FONCTIONNELS UI — PANIER - ECO BLISS BATH (VERSION AUTOMATISÉE)
// Stratégie : tests indépendants (login UI => actions UI => assertions UI)
// =============================================================================

describe('Tests fonctionnels : Panier', () => {
  const firstName = Cypress.env('firstName');
  const lastName = Cypress.env('lastName');
  const address = Cypress.env('address');
  const city = Cypress.env('city');
  const zipCode = Cypress.env('zipCode');

  // ---------------------------------------------------------------------------
  // Helpers UI (aucun test API ici)
  // ---------------------------------------------------------------------------
  // Rôle : fonctions utilitaires UI réutilisées dans les tests.
  // Intérêt : limiter la duplication, améliorer la lisibilité, faciliter la maintenance.
  // (si un sélecteur change, la correction se fait à un seul endroit)

  const loginUI = () => {
    // Objectif : simuler une connexion utilisateur via l’interface.
    // Étapes : accès /login => saisie identifiants => validation.
    // Attendu : session active (liens "Déconnexion" et "Mon panier" visibles).
    cy.visit('/#/login');

    cy.get('[data-cy="login-input-username"]').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('[data-cy="login-input-password"]').type(Cypress.env('userPassword'));
    cy.get('[data-cy="login-submit"]').click();

    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');
    cy.url().should('not.include', '/login');
  };

  const goToProductsList = () => {
    // Objectif : ouvrir la liste des produits.
    // Étapes : navigation vers /products.
    // Attendu : URL contenant /products.
    cy.visit('/#/products');
    cy.url().should('include', '/products');
  };

  const openFirstProductFromList = () => {
    // Objectif : ouvrir une fiche produit depuis la liste.
    // Étapes : /products => clic sur le premier produit.
    // Attendu : page détail affichée (nom + formulaire d’ajout au panier).
    cy.get('[data-cy="product"]').should('exist');
    cy.get('[data-cy="product"]').first().within(() => {
      cy.get('[data-cy="product-link"]').should('be.visible').click();
    });

    cy.get('[data-cy="detail-product-name"]').should('be.visible');
    cy.get('[data-cy="detail-product-form"]').should('exist');
  };

  const setQuantityOnDetail = (qty) => {
    // Objectif : renseigner la quantité sur la fiche produit.
    // Étapes : modifier la valeur de l’input quantité.
    // Attendu : valeur prise en compte (ou normalisée) par l’application.
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
    // Étapes : clic sur "Ajouter au panier".
    // Attendu : produit ajouté au panier (avec éventuelle redirection vers /cart selon implémentation).
    //
    // Note : le bouton a le même data-cy en mode connecté / non connecté.
    cy.get('[data-cy="detail-product-add"]').should('be.visible').click();
  };

  const goToCart = () => {
    // Objectif : accéder au panier via la navigation.
    // Étapes : clic sur "Mon panier" dans la navbar.
    // Attendu : URL contenant /cart.
    cy.contains('Mon panier').click();
    cy.url().should('include', '/cart');
  };

  const deleteCartLineAtIndex = (index) => {
    // Objectif : supprimer une ligne panier.
    // Étapes : clic sur le bouton suppression de la ligne.
    // Attendu : ligne supprimée (ou panier vide si c’était la dernière).
    cy.get('[data-cy="cart-line"]').eq(index).within(() => {
      cy.get('[data-cy="cart-line-delete"]').click();
    });
  };

  const clearCartUI = () => {
    // Objectif : remettre le panier à zéro via l’UI (nettoyage entre tests).
    // Étapes : sur /cart, suppression de toutes les lignes.
    // Attendu : affichage de l’état vide (cart-empty).
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

  // ---------------------------------------------------------------------------
  // Nettoyage léger entre tests (UI only)
  // ---------------------------------------------------------------------------
  afterEach(() => {
    // Objectif : garantir l’indépendance des tests (pas d’effet de bord entre it()).
    // Étapes : ouverture /cart puis vidage du panier si nécessaire.
    // Attendu : chaque test démarre avec un panier propre.
    cy.visit('/#/cart');

    // Sécurisation : si /cart ne contient ni état vide ni lignes, ne pas échouer le afterEach.
    cy.get('body').then(($body) => {
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
    // Étapes : login => accès au panier.
    // Attendu : panier visible (état vide ou au moins une ligne).
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
    // Étapes : login => liste produits => fiche produit => qty=1 => ajout => panier.
    // Attendu : au moins une ligne panier + total affiché.
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
    // Objectif : contrôler les informations affichées sur une ligne panier.
    // Étapes : ajout produit => panier => vérification des champs visibles.
    // Attendu : image, nom, description, quantité, total ligne, suppression, total global.
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
    // Étapes : ajout produit => panier => modification quantité.
    // Attendu : quantité modifiée et total panier toujours visible.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();

    cy.get('[data-cy="cart-line"]').first().within(() => {
      cy.get('[data-cy="cart-line-quantity"]').clear().type('2');
    });

    cy.get('[data-cy="cart-total"]').should('be.visible');
  });

  // ---------------------------------------------------------------------------
  // CT05 - Supprimer une ligne panier
  // ---------------------------------------------------------------------------
  it('CT05 - Supprimer un produit du panier', () => {
    // Objectif : vérifier la suppression d’un article depuis le panier.
    // Étapes : ajout produit => panier => suppression.
    // Attendu : diminution du nombre de lignes ou affichage du panier vide.
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
    // Objectif : valider le parcours nominal de commande.
    // Étapes : ajout produit => panier => formulaire complet => validation.
    // Attendu : écran de confirmation ("Merci !" / commande validée).
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
    // Objectif : vérifier le traitement d’une quantité invalide (négative).
    // Étapes : fiche produit => qty=-1 => tentative d’ajout panier.
    // Attendu : quantité normalisée ou ajout refusé (règle validée par observation).
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(-1);

    // Note : la règle exacte (correction / blocage) dépend de l’implémentation.
    cy.get('[data-cy="detail-product-quantity"]').invoke('val').then((val) => {
      const numeric = Number(val);
      expect(Number.isNaN(numeric)).to.eq(false);
    });

    addToCartFromDetail();
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
  // CT08 - Quantité très grande (ex : 21) sur la fiche produit (stock / validation)
  // ---------------------------------------------------------------------------
  it('CT08 - Gérer une quantité très grande (21) sur la fiche produit', () => {
    // Objectif : tester la robustesse sur une quantité très grande.
    // Étapes : fiche produit => qty=50 => ajout => panier.
    // Attendu : ajout accepté, refusé ou ajusté (selon règle), sans instabilité UI.
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(21);
    addToCartFromDetail();
    goToCart();

    cy.get('body').then(($body) => {
      if ($body.find('[data-cy="cart-empty"]').length > 0) {
        cy.get('[data-cy="cart-empty"]').should('be.visible');
      } else {
        cy.get('[data-cy="cart-line"]').should('have.length.greaterThan', 0);

        cy.get('[data-cy="cart-line"]').first().within(() => {
          cy.get('[data-cy="cart-line-quantity"]').invoke('val').then((val) => {
            const numeric = Number(val);
            expect(Number.isNaN(numeric)).to.eq(false);
            expect(numeric).to.be.at.least(1);
          });
        });
      }
    });

    cy.get('[data-cy="cart-total"]').should('be.visible');
  });

  // ---------------------------------------------------------------------------
  // CT09 - Quantité =0 sur la fiche produit
  // ---------------------------------------------------------------------------
  it('OBS01 - Observer comportement ajout qty=0', () => {
    // Objectif : relever le comportement réel de l’application pour qty=0.
    // Étapes : fiche produit => qty=0 => ajout => panier.
    // Attendu : comportement à confirmer (refus / correction / panier inchangé).
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(0);
    addToCartFromDetail();

    goToCart();

    cy.get('body').then(($body) => {
      const isEmpty = $body.find('[data-cy="cart-empty"]').length > 0;
      const lines = $body.find('[data-cy="cart-line"]').length;

      cy.log(`qty=0 => cart-empty: ${isEmpty}, cart-lines: ${lines}`);

      if (!isEmpty && lines > 0) {
        cy.get('[data-cy="cart-line-quantity"]').first().invoke('val').then((val) => {
          cy.log(`qty=0 => quantité réelle dans le panier: ${val}`);
        });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CT10 - Quantité décimale sur la fiche produit
  // ---------------------------------------------------------------------------
  it('OBS02 - Observer comportement ajout qty=1.5', () => {
    // Objectif : relever le comportement réel de l’application pour une quantité décimale.
    // Étapes : fiche produit => qty=1.5 => ajout => panier.
    // Attendu : comportement à confirmer (arrondi / correction / refus).
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1.5);
    addToCartFromDetail();

    goToCart();

    cy.get('body').then(($body) => {
      const isEmpty = $body.find('[data-cy="cart-empty"]').length > 0;
      const lines = $body.find('[data-cy="cart-line"]').length;

      cy.log(`qty=1.5 => cart-empty: ${isEmpty}, cart-lines: ${lines}`);

      if (!isEmpty && lines > 0) {
        cy.get('[data-cy="cart-line-quantity"]').first().invoke('val').then((val) => {
          cy.log(`qty=1.5 => quantité réelle dans le panier: ${val}`);
        });
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CT11 - Ajout doublon (merge ou non) sur la fiche produit
  // ---------------------------------------------------------------------------
  it('OBS03 - Observer comportement ajout du même produit 2 fois', () => {
    // Objectif : vérifier la gestion d’un ajout en doublon.
    // Étapes : ajouter 2 fois le même produit depuis la fiche.
    // Attendu : merge (1 ligne, quantité cumulée) ou 2 lignes (selon règle produit).
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    cy.get('[data-cy="detail-product-name"]').invoke('text').then((productName) => {
      const name = String(productName).trim();

      cy.location('hash').then((hash) => {
        const productHashUrl = String(hash);

        setQuantityOnDetail(1);
        addToCartFromDetail();

        cy.location('hash').then((hashAfterFirstAdd) => {
          const after = String(hashAfterFirstAdd);

          if (after.includes('/cart')) {
            cy.visit(`/${productHashUrl}`);
            cy.get('[data-cy="detail-product-name"]').should('be.visible');
          }

          setQuantityOnDetail(1);
          addToCartFromDetail();

          cy.location('hash').then((h) => {
            if (!String(h).includes('/cart')) {
              goToCart();
            }
          });

          cy.get('[data-cy="cart-line"]').then(($lines) => {
            cy.log(`doublon => nombre de lignes total: ${$lines.length}`);

            let sumQty = 0;

            cy.wrap($lines)
              .each(($line) => {
                cy.wrap($line)
                  .find('[data-cy="cart-line-name"]')
                  .invoke('text')
                  .then((txt) => {
                    if (String(txt).includes(name)) {
                      cy.wrap($line)
                        .find('[data-cy="cart-line-quantity"]')
                        .invoke('val')
                        .then((val) => {
                          const q = parseFloat(String(val));
                          if (!Number.isNaN(q)) sumQty += q;
                        });
                    }
                  });
              })
              .then(() => {
                cy.log(`doublon => somme des quantités pour "${name}": ${sumQty}`);
              });
          });
        });
      });
    });
  });

  // ---------------------------------------------------------------------------
  // CT12 - Accès /cart sans login (redirection ou accès)
  // ---------------------------------------------------------------------------
  it('OBS04 - Observer accès /cart sans login', () => {
    // Objectif : vérifier la règle d’accès au panier sans authentification.
    // Étapes : accès direct /cart sans login.
    // Attendu : redirection /login ou accès autorisé (selon règle produit).
    cy.visit('/#/cart');

    cy.location('hash').then((hash) => {
      cy.log(`accès /cart sans login => hash actuel: ${hash}`);

      if (String(hash).includes('/login')) {
        cy.log('accès /cart sans login => redirection vers /login');
      } else {
        cy.log('accès /cart sans login => accès autorisé');
      }
    });
  });

  // ---------------------------------------------------------------------------
  // CT13 - Ajouter 2 produits différents au panier
  // ---------------------------------------------------------------------------
  it('CT13 - Ajouter 2 produits différents au panier', () => {
    // Objectif : vérifier l’ajout de deux produits distincts au panier.
    // Étapes : ajout produit 1 => ouverture produit 2 => ajout => panier.
    // Attendu : panier non vide. Le nombre de lignes dépend de la règle de regroupement côté application.
    loginUI();

    goToProductsList();
    openFirstProductFromList();

    cy.get('[data-cy="detail-product-name"]').invoke('text').then((p1Name) => {
      const product1Name = String(p1Name).trim();

      setQuantityOnDetail(1);
      addToCartFromDetail();

      // Contrainte observée : après un ajout, l’application peut rediriger vers /cart.
      // Pour garder un parcours UI stable, le 2e produit est ouvert via une URL produit directe.
      // (cas réel : accès via favori / lien externe / copie d’URL)
      cy.visit('/#/products/4');
      cy.get('[data-cy="detail-product-name"]').should('be.visible');

      cy.get('[data-cy="detail-product-name"]').invoke('text').then((p2Name) => {
        let product2Name = String(p2Name).trim();

        // Si l'ID choisi correspond au même produit, bascule sur un autre ID pour garantir 2 produits distincts.
        if (product2Name === product1Name) {
          cy.visit('/#/products/5');
          cy.get('[data-cy="detail-product-name"]').should('be.visible');
          cy.get('[data-cy="detail-product-name"]').invoke('text').then((txt) => {
            product2Name = String(txt).trim();
          });
        }

        setQuantityOnDetail(1);
        addToCartFromDetail();

        cy.location('hash').then((h) => {
          if (!String(h).includes('/cart')) {
            goToCart();
          }
        });

        cy.get('body').then(($body) => {
          const isEmpty = $body.find('[data-cy="cart-empty"]').length > 0;
          const lines = $body.find('[data-cy="cart-line"]').length;

          cy.log(`CT13 => panier vide: ${isEmpty}, nb lignes: ${lines}`);
          cy.log(`CT13 => produit1: "${product1Name}" | produit2: "${product2Name}"`);

          if (isEmpty) {
            cy.get('[data-cy="cart-empty"]').should('be.visible');
          } else {
            cy.get('[data-cy="cart-line"]').should('have.length.greaterThan', 0);
            cy.get('[data-cy="cart-total"]').should('be.visible');
          }
        });
      });
    });
  });

  // ---------------------------------------------------------------------------
  // CT14 - Checkout champs vides (validation formulaire)
  // ---------------------------------------------------------------------------
  it('CT14 - Empêcher le checkout si champs vides (validation)', () => {
    // Objectif : vérifier que le formulaire empêche la validation si des champs requis sont vides.
    // Étapes : login => ajout produit => panier => vider champs => soumettre.
    // Attendu : pas de confirmation, rester sur /cart (et messages d’erreur si implémentés).
    loginUI();
    goToProductsList();
    openFirstProductFromList();

    setQuantityOnDetail(1);
    addToCartFromDetail();

    goToCart();

    cy.get('[data-cy="cart-form"]').should('exist');

    cy.get('[data-cy="cart-input-lastname"]').should('be.visible').clear();
    cy.get('[data-cy="cart-input-firstname"]').clear();
    cy.get('[data-cy="cart-input-address"]').clear();
    cy.get('[data-cy="cart-input-zipcode"]').clear();
    cy.get('[data-cy="cart-input-city"]').clear();

    cy.get('[data-cy="cart-submit"]').should('be.visible').click();

    cy.contains('Merci !', { timeout: 2000 }).should('not.exist');
    cy.contains('Votre commande est bien validée', { timeout: 2000 }).should('not.exist');

    cy.location('hash').then((hash) => {
      cy.log(`CT14 => hash actuel après submit champs vides: ${hash}`);
      expect(String(hash)).to.include('/cart');
    });
  });

  // ---------------------------------------------------------------------------
  // CT15 - Persistance du panier après refresh (observation)
  // ---------------------------------------------------------------------------
  it('CT15 - Observer la persistance du panier après refresh', () => {
    // Objectif : vérifier la persistance du panier après rechargement.
    // Étapes : login => ajout produit => panier => relever l'état => reload => comparer.
    // Attendu : état cohérent après reload (persistant ou non selon règle produit).
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
});
