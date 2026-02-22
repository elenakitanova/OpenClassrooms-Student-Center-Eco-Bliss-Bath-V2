// =============================================================================
// SMOKE TESTS UI - ECO BLISS BATH (VERSION AUTOMATISÉE)
// =============================================================================
//
// DÉFINITION (SMOKE)
// -----------------------------------------------------------------------------
// Ces tests vérifient rapidement que l’application est “vivante” côté UI :
// - les pages critiques se chargent,
// - les points d’entrée essentiels sont visibles,
// - les CTA principaux existent.
//
// IMPORTANT
// -----------------------------------------------------------------------------
// Un smoke test ne cherche pas à prouver des règles métier fines (stock, logique
// panier, validations détaillées). Ces règles sont couvertes dans les tests
// fonctionnels / hybrides (ex : CT16/CT17).
// =============================================================================


// BESOIN 1 : L'utilisateur doit pouvoir se connecter au site
// =============================================================================
//
// Ce besoin est validé au niveau “smoke” par :
// - la présence du lien "Connexion" (point d’entrée),
// - l’accès à la page /login,
// - la présence des champs et du bouton nécessaires au login.
// =============================================================================

describe('Besoin : Connexion au site', () => {

  /**
   * ---------------------------------------------------------------------------
   * SCÉNARIO : Vérifier la présence des champs et boutons de connexion
   * ---------------------------------------------------------------------------
   * Objectif :
   * - S’assurer que le parcours de connexion est accessible dès l’interface.
   *
   * Ce que je veux vérifier :
   * - Présence du lien "Connexion" dans la navbar.
   * - Accès à la page de connexion et présence des champs.
   *
   * Attendu côté user :
   * - L’utilisateur voit immédiatement comment se connecter.
   *
   * Attendu côté business :
   * - Le point d’entrée “session utilisateur” est disponible (pré-requis parcours panier).
   * ---------------------------------------------------------------------------
   */

  // CDT1
  // ---------------------------------------------------------------------------
  it('CDT1 : Vérifier la présence du lien "Connexion" dans la Navbar', () => {

    // Objectif (SMOKE) :
    // - Vérifier que la page d’accueil charge correctement et affiche les éléments de navigation.
    //
    // Ce que je vérifie :
    // - La navbar est présente.
    // - Le lien "Connexion" est visible (point d’entrée du parcours login).
    //
    // Attendu côté user :
    // - L’utilisateur comprend immédiatement où cliquer pour se connecter.
    //
    // Attendu côté business :
    // - Le parcours d’authentification est accessible (pré-requis aux parcours protégés).
    //
    // Preuve attendue (si test vert) :
    // - Le texte "Connexion" est visible dans la page (navbar).

    cy.visit('/#/');

    cy.contains('Connexion').should('be.visible');
  });


  // CDT2
  // ---------------------------------------------------------------------------
  it('CDT2 : Vérifier l\'affichage de la Page de Connexion et de ses champs', () => {

    // Objectif (SMOKE) :
    // - Vérifier que l’accès à la page /login fonctionne et que le formulaire est présent.
    //
    // Ce que je vérifie :
    // - Navigation vers /login depuis la home.
    // - Présence du bouton "Se connecter" et des libellés "Email" / "Mot de passe".
    //
    // Attendu côté user :
    // - L’utilisateur peut saisir ses identifiants (UI prête à l’usage).
    //
    // Attendu côté business :
    // - Le parcours login est exploitable (pas de page cassée, pas de formulaire manquant).
    //
    // Preuve attendue (si test vert) :
    // - URL contient /login.
    // - Les éléments essentiels du formulaire sont visibles.

    cy.visit('/#/');
    cy.contains('Connexion').click();

    cy.url().should('include', '/login');

    cy.contains('button', 'Se connecter').should('be.visible');
    cy.contains('Email').should('be.visible');
    cy.contains('Mot de passe').should('be.visible');
  });
});



// BESOIN 2: L'utilisateur connecté doit pouvoir ajouter des produits au panier
// =============================================================================
//
// Ce besoin est validé au niveau “smoke” par :
// - la connexion UI (pré-requis),
// - la présence des liens de session (Mon panier / Déconnexion),
// - l’accès au catalogue et aux fiches produit,
// - la présence du CTA "Ajouter au panier" sur des fiches produit.
// =============================================================================

describe('Besoin : Ajout au panier (Utilisateur connecté)', () => {

  /**
   * ---------------------------------------------------------------------------
   * SCÉNARIO : Vérifier la présence des boutons d’ajout au panier quand
   * l'utilisateur est connecté, afin de valider l’accessibilité du parcours.
   * ---------------------------------------------------------------------------
   * Objectif :
   * - Confirmer qu’une session connectée donne accès aux pages/CTA indispensables au panier.
   *
   * Ce que je veux vérifier :
   * - La connexion fonctionne (au moins au niveau navigation).
   * - Le catalogue est accessible.
   * - Les fiches produit sont accessibles.
   * - Le bouton "Ajouter au panier" est présent sur les fiches.
   *
   * Attendu côté user :
   * - Il peut naviguer et initier un ajout panier.
   *
   * Attendu côté business :
   * - Le parcours conversion (catalogue → fiche → ajout) est disponible.
   * ---------------------------------------------------------------------------
   */

  beforeEach(() => {
    // PRÉ-REQUIS (SMOKE) : établir une session connectée
    // -------------------------------------------------------------------------
    // Objectif :
    // - Démarrer chaque test du besoin 2 avec un utilisateur authentifié.
    //
    // Ce que je vérifie indirectement :
    // - La page /login charge.
    // - Les champs sont utilisables.
    // - La soumission ne bloque pas et la redirection hors /login a lieu.
    //
    // Preuve attendue (si prérequis OK) :
    // - L’URL ne contient plus /login après la connexion.
    // -------------------------------------------------------------------------

    cy.visit('/#/login');

    cy.get('input#username').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('input#password').type(Cypress.env('userPassword'));
    cy.contains('button', 'Se connecter').click();

    cy.url().should('not.include', '/login');
  });

  // CDT1
  // ---------------------------------------------------------------------------
  it('CDT1 : Vérifier le changement des liens de navigation (Mon panier et Déconnexion) après connexion', () => {
    // Objectif (SMOKE) :
    // - Vérifier que l’UI reflète bien l’état “connecté”.
    //
    // Ce que je vérifie :
    // - Présence des liens "Mon panier" et "Déconnexion" dans la navbar.
    //
    // Attendu côté user :
    // - Il voit qu’il est connecté et peut accéder à son panier.
    //
    // Attendu côté business :
    // - Le site expose les entrées des parcours protégés quand la session est active.
    //
    // Preuve attendue (si test vert) :
    // - "Mon panier" visible
    // - "Déconnexion" visible

    cy.visit('/#/');

    cy.contains('Mon panier').should('be.visible');
    cy.contains('Déconnexion').should('be.visible');
  });

  // CDT2
  // ---------------------------------------------------------------------------
  it('CDT2 : Vérifier l\'accès à la Page Produits depuis la Page d\'Accueil', () => {
    // Objectif (SMOKE) :
    // - Vérifier que le catalogue est accessible depuis la home.
    //
    // Ce que je vérifie :
    // - Présence d’un point d’entrée "Produits".
    // - Présence du bouton "Voir les produits".
    //
    // Attendu côté user :
    // - Il peut accéder au catalogue pour commencer ses achats.
    //
    // Attendu côté business :
    // - Le catalogue est atteignable (pré-requis vente).
    //
    // Preuve attendue (si test vert) :
    // - "Produits" visible
    // - bouton "Voir les produits" visible

    cy.visit('/#/');

    cy.contains('Produits').should('be.visible');
    cy.contains('button', 'Voir les produits').should('be.visible');
  });

  // CDT3
  // ---------------------------------------------------------------------------
  it('CDT3 : Vérifier l\'accès à la page de détail de chaque produit', () => {
    // Objectif (SMOKE) :
    // - Vérifier que le catalogue charge et qu’au moins une entrée produit est consultable.
    //
    // Ce que je vérifie :
    // - La page /products s’affiche.
    // - Un bouton "Consulter" est visible (accès aux fiches produit).
    //
    // Attendu côté user :
    // - Il peut ouvrir une fiche produit.
    //
    // Attendu côté business :
    // - Les fiches produit sont accessibles (pré-requis ajout panier).
    //
    // Preuve attendue (si test vert) :
    // - Le texte "Consulter" est visible sur la liste.

    cy.visit('/#/products');

    cy.contains('Consulter').should('be.visible');
  });

  // CDT4
  // ---------------------------------------------------------------------------
  it('CDT4 : Smoke — pages produits 3 à 10 chargent + bouton "Ajouter au panier" présent', () => {
    // Objectif (SMOKE) :
    // - Vérifier rapidement que plusieurs fiches produit “échantillon” se chargent.
    // - Vérifier que le CTA principal "Ajouter au panier" est présent sur ces fiches.
    //
    // Important (périmètre volontairement large) :
    // - On ne valide PAS ici la règle stock (disabled/refus).
    //   Cette règle est couverte par les tests métier (CT16/CT17 API ou hybrides).
    //
    // Attendu côté user :
    // - L’utilisateur peut consulter une fiche produit et voit le bouton d’ajout.
    //
    // Attendu côté business :
    // - Le CTA d’achat est disponible (pré-requis conversion).
    //
    // Preuve attendue (si test vert) :
    // - Le nom produit est visible.
    // - Le bouton "Ajouter au panier" est visible.
    // - Si un champ stock existe, il est visible (sans interpréter sa valeur).

    const ids = [3, 4, 5, 6, 7, 8, 9, 10];

    ids.forEach((id) => {
      cy.visit(`/#/products/${id}`);

      cy.get('[data-cy="detail-product-name"]', { timeout: 15000 }).should('be.visible');

      cy.contains('button', 'Ajouter au panier').should('be.visible');

      cy.get('body').then(($body) => {
        if ($body.find('[data-cy="detail-product-stock"]').length > 0) {
          cy.get('[data-cy="detail-product-stock"]').should('be.visible');
        }
      });
    });
  });
});