// =============================================================================
// TESTS FONCTIONNELS UI — CONNEXION — ECO BLISS BATH (VERSION AUTOMATISÉE)
// =============================================================================
//
// OBJECTIF DU FICHIER
// -----------------------------------------------------------------------------
// Vérifier, côté interface (UI), le fonctionnement du parcours de connexion.
// Ces tests valident ce que voit réellement l’utilisateur (formulaire, messages,
// bascule de navigation), et donc la capacité à démarrer une session.
//
// POURQUOI C’EST CRITIQUE (USER + BUSINESS)
// -----------------------------------------------------------------------------
// - Côté user : sans connexion fiable, impossible d’accéder au panier / passer commande.
// - Côté business : la connexion est un prérequis à la conversion (achat) et à la sécurité.
//
// PRINCIPE DE PREUVE (SI TESTS VERTS)
// -----------------------------------------------------------------------------
// - L’état “connecté” est prouvé via des indices UI stables :
//   * présence de “Mon panier” et “Déconnexion”
//   * absence du lien “Connexion”
//   * sortie de l’URL /login
//
// NOTE
// -----------------------------------------------------------------------------
// Les tests sont volontairement orientés “résultat” (ce que l’utilisateur constate),
// pas sur l’implémentation technique (token/localStorage)
// =============================================================================

describe('Tests fonctionnels : Connexion', () => {
  beforeEach(() => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Garantir un point de départ identique avant chaque test (isolation des scénarios).
    //
    // CE QUE JE VEUX VÉRIFIER
    // =========================================================================
    // - Que la page de connexion est accessible à tout moment.
    // - Que le formulaire est disponible pour exécuter le scénario du test.
    //
    // ATTENDU CÔTÉ USER
    // =========================================================================
    // - L’utilisateur arrive sur une page “Connexion” exploitable (email + mot de passe + bouton).
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - La page /login doit être stable : c’est l’entrée des parcours authentifiés (panier/commande).
    //
    // PREUVE ATTENDUE (SI PRÉCONDITION OK)
    // =========================================================================
    // - L’écran /login s’affiche. Les tests suivants pourront interagir avec les champs.
    // =========================================================================
    cy.visit('/#/login');
  });

  // ----------------------------------------
  // CT01 - Connexion réussie avec email et mot de passe valides
  // ----------------------------------------
  it('CT01 - Connexion réussie avec email et mot de passe valides', () => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Vérifier le scénario nominal : un utilisateur peut se connecter avec des identifiants valides.
    //
    // CE QUE JE VEUX TESTER (COMPORTEMENT UI)
    // =========================================================================
    // - Saisie email + mot de passe valides
    // - Soumission du formulaire
    // - Bascule de l’application vers l’état “session active”
    //
    // ATTENDU CÔTÉ USER (EXPÉRIENCE)
    // =========================================================================
    // - L’utilisateur quitte l’écran de login.
    // - Il voit immédiatement qu’il est connecté grâce à la navigation :
    //   “Mon panier” et “Déconnexion” deviennent visibles.
    // - Il ne voit plus le lien “Connexion”.
    //
    // ATTENDU CÔTÉ BUSINESS / SÉCURITÉ
    // =========================================================================
    // - Une session authentifiée est créée, donnant accès aux fonctionnalités protégées.
    // - La navigation reflète clairement l’état connecté (réduction du doute et des erreurs).
    //
    // ÉTAT OBTENU / PREUVE (SI TEST VERT)
    // =========================================================================
    // - “Mon panier” visible + “Déconnexion” visible
    // - URL ne contient plus /login
    // - “Connexion” n’est plus affiché
    // =========================================================================

    cy.get('[data-cy="login-input-username"]').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('[data-cy="login-input-password"]').should('be.visible').type(Cypress.env('userPassword'));
    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');
    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.url().should('not.include', '/login');

    // Bon sens UX : une fois connecté, le lien "Connexion" ne devrait plus être visible
    cy.contains('Connexion').should('not.exist');
  });

  // ----------------------------------------
  // CT02 - Connexion échoue avec mauvais mot de passe
  // ----------------------------------------
  it('CT02 - Connexion échoue avec mauvais mot de passe', () => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Vérifier que la connexion est refusée si le mot de passe est incorrect.
    //
    // CE QUE JE VEUX TESTER (SÉCURITÉ + UI)
    // =========================================================================
    // - L’application n’ouvre pas de session si le couple email/mot de passe est invalide.
    // - Un message explicite informe l’utilisateur.
    // - La navigation ne bascule pas en mode “connecté”.
    //
    // ATTENDU CÔTÉ USER (EXPÉRIENCE)
    // =========================================================================
    // - L’utilisateur reste sur l’écran de login.
    // - Il voit “Identifiants incorrects”.
    // - Il ne voit pas “Mon panier” ni “Déconnexion”.
    //
    // ATTENDU CÔTÉ BUSINESS / SÉCURITÉ
    // =========================================================================
    // - Empêcher l’accès à un compte via des identifiants erronés.
    // - S’assurer que l’UI ne donne pas de faux signal de connexion.
    //
    // ÉTAT OBTENU / PREUVE (SI TEST VERT)
    // =========================================================================
    // - Message “Identifiants incorrects” visible
    // - “Mon panier” absent
    // - “Déconnexion” absent
    // =========================================================================

    cy.get('[data-cy="login-input-username"]').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('[data-cy="login-input-password"]').should('be.visible').type('mauvaismotdepasse');
    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    cy.contains('Identifiants incorrects', { timeout: 10000 }).should('be.visible');
    cy.contains('Mon panier').should('not.exist');
    cy.contains('Déconnexion').should('not.exist');
  });

  // ----------------------------------------
  // CT03 - Connexion échoue avec email inexistant
  // ----------------------------------------
  it('CT03 - Connexion échoue avec email inexistant', () => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Vérifier que la connexion est refusée si l’email n’existe pas.
    //
    // CE QUE JE VEUX TESTER (SÉCURITÉ + UI)
    // =========================================================================
    // - La plateforme ne doit pas authentifier un utilisateur inconnu.
    // - L’UI doit afficher un message d’erreur et rester en état “non connecté”.
    //
    // ATTENDU CÔTÉ USER (EXPÉRIENCE)
    // =========================================================================
    // - L’utilisateur est informé que les identifiants sont incorrects.
    // - Aucun indice visuel ne doit indiquer une session active.
    //
    // ATTENDU CÔTÉ BUSINESS / SÉCURITÉ
    // =========================================================================
    // - Protection contre les accès non autorisés.
    // - Cohérence du parcours : pas de panier/commande accessible sans compte valide.
    //
    // ÉTAT OBTENU / PREUVE (SI TEST VERT)
    // =========================================================================
    // - Message “Identifiants incorrects” visible
    // - “Mon panier” absent
    // - “Déconnexion” absent
    // =========================================================================

    cy.get('[data-cy="login-input-username"]').should('be.visible').type('inexistant@example.com');
    cy.get('[data-cy="login-input-password"]').should('be.visible').type(Cypress.env('userPassword'));
    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    cy.contains('Identifiants incorrects', { timeout: 10000 }).should('be.visible');
    cy.contains('Mon panier').should('not.exist');
    cy.contains('Déconnexion').should('not.exist');
  });

  // ----------------------------------------
  // CT04 - Connexion échoue avec champs vides
  // ----------------------------------------
  it('CT04 - Connexion échoue avec champs vides', () => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Vérifier la validation du formulaire : on ne peut pas soumettre un login vide.
    //
    // CE QUE JE VEUX TESTER (QUALITÉ UI)
    // =========================================================================
    // - Le système bloque la soumission si email/mot de passe ne sont pas remplis.
    // - Un message d’erreur global guide l’utilisateur.
    // - La session ne doit évidemment pas être créée.
    //
    // ATTENDU CÔTÉ USER (EXPÉRIENCE)
    // =========================================================================
    // - L’utilisateur voit une erreur claire (“Merci de remplir…”).
    // - Il comprend qu’il doit compléter les champs.
    // - Il ne voit pas d’éléments de session (“Mon panier”, “Déconnexion”).
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Réduction des appels inutiles au backend.
    // - Meilleure qualité de saisie, moins d’échecs incompréhensibles.
    //
    // ÉTAT OBTENU / PREUVE (SI TEST VERT)
    // =========================================================================
    // - Message global visible
    // - Aucun indice UI de connexion
    // =========================================================================

    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    // Déclenchement de la validation côté UI (si la validation dépend d’un blur)
    cy.get('[data-cy="login-input-username"]').focus().blur();
    cy.get('[data-cy="login-input-password"]').focus().blur();

    cy.contains('Merci de remplir correctement tous les champs', { timeout: 10000 }).should('be.visible');

    // Vérification de non-connexion (aucun élément de session)
    cy.contains('Mon panier').should('not.exist');
    cy.contains('Déconnexion').should('not.exist');
  });

  // ----------------------------------------
  // CT05 - Les erreurs disparaissent après correction
  // ----------------------------------------
  it('CT05 - Les erreurs disparaissent après correction des champs', () => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Vérifier qu’une erreur de validation n’est pas “bloquante” :
    // elle doit disparaître dès que l’utilisateur corrige la saisie.
    //
    // CE QUE JE VEUX TESTER (QUALITÉ UX)
    // =========================================================================
    // - Soumission vide -> erreur visible
    // - Correction des champs -> nouvelle soumission
    // - Disparition du message d’erreur
    // - Connexion effective si identifiants valides
    //
    // ATTENDU CÔTÉ USER (EXPÉRIENCE)
    // =========================================================================
    // - L’utilisateur n’est pas “piégé” par un message d’erreur persistant.
    // - Une fois corrigé, l’accès est accordé et l’état connecté s’affiche.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Réduction de l’abandon (moins de frustration).
    // - Parcours fluide : correction -> réussite.
    //
    // ÉTAT OBTENU / PREUVE (SI TEST VERT)
    // =========================================================================
    // - Le message “Merci de remplir…” n’existe plus
    // - “Déconnexion” et “Mon panier” visibles
    // =========================================================================

    // 1) Déclenchement volontaire de la validation
    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    // 2) Correction des champs
    cy.get('[data-cy="login-input-username"]').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('[data-cy="login-input-password"]').should('be.visible').type(Cypress.env('userPassword'));

    // 3) Soumission après correction
    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    // 4) Le message d’erreur ne doit plus être présent
    cy.contains('Merci de remplir correctement tous les champs', { timeout: 2000 }).should('not.exist');

    // 5) Indice UI que la session est créée
    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');
  });

  // ----------------------------------------
  // CT06 - Session persistante après rafraîchissement
  // ----------------------------------------
  it('CT06 - Session persistante après rafraîchissement', () => {
    // =========================================================================
    // OBJECTIF
    // =========================================================================
    // Vérifier la persistance de session : un refresh ne doit pas déconnecter l’utilisateur.
    //
    // CE QUE JE VEUX TESTER (ROBUSTESSE)
    // =========================================================================
    // - Connexion réussie
    // - Reload de la page
    // - L’état connecté est toujours visible
    //
    // ATTENDU CÔTÉ USER (EXPÉRIENCE)
    // =========================================================================
    // - L’utilisateur ne perd pas sa session en rafraîchissant (comportement attendu e-commerce).
    // - Il reste sur une page accessible, sans être renvoyé sur /login.
    //
    // ATTENDU CÔTÉ BUSINESS
    // =========================================================================
    // - Réduction du churn : une session stable augmente la conversion.
    // - Cohérence : un utilisateur connecté doit pouvoir reprendre son parcours.
    //
    // ÉTAT OBTENU / PREUVE (SI TEST VERT)
    // =========================================================================
    // - Après reload : “Déconnexion” visible + “Mon panier” visible
    // - URL ne contient pas /login
    // =========================================================================

    cy.get('[data-cy="login-input-username"]').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('[data-cy="login-input-password"]').should('be.visible').type(Cypress.env('userPassword'));
    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');

    cy.reload();

    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');

    // Bon sens UX : après reload en étant connecté, on ne revient pas sur /login
    cy.url().should('not.include', '/login');
  });
});