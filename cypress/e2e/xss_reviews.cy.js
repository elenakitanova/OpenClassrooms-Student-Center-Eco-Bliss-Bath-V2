// =============================================================================
// TEST SÉCURITÉ (XSS) — REVIEWS - ECO BLISS BATH (VERSION AUTOMATISÉE)
// =============================================================================
// Stratégie : test UI réel (connexion UI => saisie payload => publication => vérification non-exécution)
// Objectif global : s'assurer qu'un contenu malveillant injecté dans un commentaire n'est jamais exécuté.
// =============================================================================

describe('Sécurité : XSS Reviews', () => {
  const email = Cypress.env('userEmail');
  const password = Cypress.env('userPassword');

  // ---------------------------------------------------------------------------
  // Helper UI : Connexion
  // ---------------------------------------------------------------------------
  // Objectif : établir une session utilisateur via l’interface (comme un vrai client).
  // Étapes : /login => saisie identifiants => soumission => vérification navbar.
  // Attendu : apparition du lien "Déconnexion" (preuve que la session est active).
  const loginUI = () => {
    // Objectif : simuler une connexion utilisateur "réelle" via l’interface.
    // Étapes : accéder à /login, saisir email/mdp, cliquer sur "Se connecter".
    // Attendu : session active (navbar affiche "Déconnexion").
    cy.visit('/#/login');

    cy.get('[data-cy="login-input-username"]')
      .should('be.visible')
      .type(email);

    cy.get('[data-cy="login-input-password"]')
      .should('be.visible')
      .type(password);

    cy.get('[data-cy="login-submit"]')
      .should('be.visible')
      .click();

    // Attendre que la session soit bien établie
    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
  };

  // ---------------------------------------------------------------------------
  // Pré-requis : être connecté avant d'accéder au formulaire d'avis
  // ---------------------------------------------------------------------------
  beforeEach(() => {
    // Objectif : garantir que le formulaire d’avis est accessible (affiché uniquement si isLogged = true).
    // Étapes : exécuter une connexion UI avant chaque test.
    // Attendu : une fois sur /reviews, le formulaire (data-cy="review-form") doit exister.
    loginUI();
  });

  // ---------------------------------------------------------------------------
  // [OBLIGATOIRE] Test XSS : le script ne doit pas s’exécuter
  // ---------------------------------------------------------------------------
  it('[OBLIGATOIRE] XSS - Le commentaire ne doit pas être exécuté (script neutralisé)', () => {
    // Objectif : vérifier qu’un payload XSS injecté dans un commentaire ne s’exécute jamais côté navigateur.
    //
    // Étapes :
    // 1) Aller sur /reviews (page avis)
    // 2) Initialiser un marqueur JS window.__xssTriggered = false
    // 3) Remplir le formulaire d’avis avec un payload contenant un "onerror" (tentative d’exécution)
    // 4) Publier l’avis
    // 5) Vérifier que window.__xssTriggered est toujours false (aucune exécution)
    // 6) Vérifier que le commentaire a bien été affiché (le marker est visible)
    //
    // Attendu :
    // - Le commentaire est accepté/affiché comme du texte (ou HTML neutralisé)
    // - Le code JavaScript injecté n’est jamais exécuté (flag reste false)

    // 1) Accès à /reviews + synchronisation réseau (évite flaky)
    cy.intercept('GET', '**/reviews').as('getReviews');
    cy.visit('/#/reviews');
    cy.wait('@getReviews').its('response.statusCode').should('eq', 200);

    // Vérification : le formulaire existe uniquement si l’utilisateur est connecté
    cy.get('[data-cy="review-form"]').should('be.visible');

    // Marqueur unique pour retrouver l’avis publié dans la liste
    const marker = `XSS_${Date.now()}`;

    // 2) Payload : si exécuté => window.__xssTriggered = true
    // Important : on ajoute aussi le marker dans le texte pour prouver l’affichage du contenu.
    const payload = `<img src=x onerror="window.__xssTriggered=true"> ${marker}`;

    // 3) Initialisation du flag (doit rester false quoi qu’il arrive)
    cy.window().then((win) => {
      win.__xssTriggered = false;
    });

    // 4) Remplissage du formulaire
    // Rating : l’input est hidden, donc on force la valeur et on déclenche les events attendus par Angular.
    cy.get('[data-cy="review-input-rating"]')
      .should('exist')
      .invoke('val', '5')
      .trigger('input', { force: true })
      .trigger('change', { force: true });

    // Title : champ texte
    cy.get('[data-cy="review-input-title"]')
      .should('be.visible')
      .clear()
      .type(`Test ${marker}`);

    // Comment : champ texte (là où on injecte le payload)
    cy.get('[data-cy="review-input-comment"]')
      .should('be.visible')
      .clear()
      .type(payload);

    // 5) Publication + synchro POST
    cy.intercept('POST', '**/reviews').as('postReview');
    cy.get('[data-cy="review-submit"]')
      .should('be.visible')
      .click();

    cy.wait('@postReview').its('response.statusCode').should('be.oneOf', [200, 201]);

    // 6) Assertion sécurité : le payload n’a pas déclenché d’exécution JS
    cy.window().its('__xssTriggered').should('eq', false);

    // 7) Assertion fonctionnelle : le marker est bien visible dans la liste des avis
    // (preuve que l’avis a été créé/affiché, et pas bloqué silencieusement)
    cy.contains(marker, { timeout: 15000 }).should('be.visible');

    // 8) Double-check après rendu Angular (la page affiche le commentaire via innerHTML)
    // Objectif : vérifier qu’aucune exécution n’a lieu au moment de l’injection/rendu.
    cy.window().its('__xssTriggered').should('eq', false);
  });
});
