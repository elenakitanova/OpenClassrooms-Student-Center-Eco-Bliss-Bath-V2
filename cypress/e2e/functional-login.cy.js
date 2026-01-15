describe('Tests fonctionnels : Connexion', () => {
  beforeEach(() => {
    cy.visit('/#/login'); // Accès à la page login
  });

  // ----------------------------------------
  // CT01 - Connexion réussie avec email et mot de passe valides
  // ----------------------------------------
  it('CT01 - Connexion réussie avec email et mot de passe valides', () => {
    cy.get('input#username').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('input#password').type(Cypress.env('userPassword'));
    cy.contains('button', 'Se connecter').click();

    cy.contains('Mon panier', { timeout: 15000 }).should('be.visible');
    cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
    cy.url().should('include', '/#/');
  });

  // ----------------------------------------
  // CT02 - Connexion échoue avec mauvais mot de passe
  // ----------------------------------------
  it('CT02 - Connexion échoue avec mauvais mot de passe', () => {
    cy.get('input#username').type(Cypress.env('userEmail'));
    cy.get('input#password').type('mauvaismotdepasse');
    cy.contains('button', 'Se connecter').click();

    cy.contains('Identifiants incorrects', { timeout: 10000 }).should('be.visible');

    cy.contains('Mon panier').should('not.exist');
    cy.contains('Déconnexion').should('not.exist');
  });

  // ----------------------------------------
  // CT03 - Connexion échoue avec email inexistant
  // ----------------------------------------
  it('CT03 - Connexion échoue avec email inexistant', () => {
    cy.get('input#username').type('inexistant@example.com');
    cy.get('input#password').type(Cypress.env('userPassword'));
    cy.contains('button', 'Se connecter').click();

    cy.contains('Identifiants incorrects', { timeout: 10000 }).should('be.visible');

    cy.contains('Mon panier').should('not.exist');
    cy.contains('Déconnexion').should('not.exist');
  });

  // ----------------------------------------
  // CT04 - Connexion échoue avec champs vides
  // ----------------------------------------
  it('CT04 - Connexion échoue avec champs vides', () => {
    cy.contains('button', 'Se connecter').click();

    // Optionnel : forcer blur pour déclencher la validation
    cy.get('input#username').focus().blur();
    cy.get('input#password').focus().blur();

    // Vérifier le message global pour champs vides
    cy.contains('Merci de remplir correctement tous les champs', { timeout: 10000 }).should('be.visible');
  });

  // ----------------------------------------
// CT05 - Les erreurs disparaissent après correction
// ----------------------------------------
it('CT05 - Les erreurs disparaissent après correction des champs', () => {
  // 1️Soumettre avec champs vides pour déclencher le message
  cy.contains('button', 'Se connecter').click();

  // 2️Remplir email et mot de passe correctement
  cy.get('input#username').type(Cypress.env('userEmail'));
  cy.get('input#password').type(Cypress.env('userPassword'));

  // 3️Recliquer sur "Se connecter" pour valider les champs
  cy.contains('button', 'Se connecter').click();

  // 4️Vérifier que le message d'erreur a disparu
  cy.contains('Merci de remplir correctement tous les champs').should('not.exist');

  // 5️Vérifier que la connexion est réussie
  cy.contains('Déconnexion', { timeout: 15000 }).should('be.visible');
});

  // ----------------------------------------
  // CT06 - Session persistante après rafraîchissement
  // ----------------------------------------
  it('CT06 - Session persistante après rafraîchissement', () => {
    cy.get('input#username').type(Cypress.env('userEmail'));
    cy.get('input#password').type(Cypress.env('userPassword'));
    cy.contains('button', 'Se connecter').click();

    cy.contains('Déconnexion').should('be.visible');
    cy.reload();
    cy.contains('Déconnexion').should('be.visible');
    cy.contains('Mon panier').should('be.visible');
  });

});