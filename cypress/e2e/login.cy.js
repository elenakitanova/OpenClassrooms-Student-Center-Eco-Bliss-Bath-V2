// =============================================================================
// TESTS FONCTIONNELS UI — CONNEXION - ECO BLISS BATH (VERSION AUTOMATISÉE)
// =============================================================================

describe('Tests fonctionnels : Connexion', () => {
  beforeEach(() => {
    // Objectif : démarrer chaque test sur une page de référence identique.
    // Étapes : accès direct à /login avant chaque it().
    // Attendu : formulaire de connexion disponible pour le scénario du test.
    cy.visit('/#/login');
  });

  // ----------------------------------------
  // CT01 - Connexion réussie avec email et mot de passe valides
  // ----------------------------------------
  it('CT01 - Connexion réussie avec email et mot de passe valides', () => {
    // Objectif : vérifier qu’un utilisateur peut se connecter avec des identifiants valides.
    // Étapes : renseigner email + mot de passe => soumettre.
    // Attendu : apparition des éléments "Mon panier" et "Déconnexion" + sortie de la page /login.

    cy.get('[data-cy="login-input-username"]').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('[data-cy="login-input-password"]').should('be.visible').type(Cypress.env('userPassword'));
    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');
    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.url().should('not.include', '/login');
  });

  // ----------------------------------------
  // CT02 - Connexion échoue avec mauvais mot de passe
  // ----------------------------------------
  it('CT02 - Connexion échoue avec mauvais mot de passe', () => {
    // Objectif : vérifier le refus de connexion si le mot de passe est incorrect.
    // Étapes : email valide + mot de passe invalide => soumettre.
    // Attendu : message "Identifiants incorrects" + aucun élément de session (pas de panier, pas de déconnexion).

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
    // Objectif : vérifier le refus de connexion si l’email n’existe pas.
    // Étapes : email inexistant + mot de passe => soumettre.
    // Attendu : message "Identifiants incorrects" + aucun élément de session visible.

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
    // Objectif : vérifier la validation du formulaire si aucun champ n’est renseigné.
    // Étapes : soumettre le formulaire vide (puis blur pour déclencher la validation si nécessaire).
    // Attendu : message global indiquant que les champs doivent être correctement remplis.

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
    // Objectif : vérifier que les messages d’erreur disparaissent une fois les champs corrigés.
    // Étapes : soumettre vide => afficher erreur => remplir correctement => resoumettre.
    // Attendu : disparition du message d’erreur + connexion effective (présence "Déconnexion").

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
    // Objectif : vérifier qu’une session reste active après un rechargement de page.
    // Étapes : se connecter => vérifier éléments de session => reload => revérifier.
    // Attendu : après reload, l’utilisateur est toujours considéré comme connecté (navbar inchangée).

    cy.get('[data-cy="login-input-username"]').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('[data-cy="login-input-password"]').should('be.visible').type(Cypress.env('userPassword'));
    cy.get('[data-cy="login-submit"]').should('be.visible').click();

    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');

    cy.reload();

    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');
  });
});