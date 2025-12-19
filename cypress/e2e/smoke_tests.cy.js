// =============================================================================
// BESOIN 1 : L'utilisateur doit pouvoir se connecter au site
// =============================================================================

describe('Besoin : Connexion au site', () => {

  /**
   * ---------------------------------------------------------------------------
   * SCÉNARIO : Vérifier la présence des champs et boutons de connexion 
   * ---------------------------------------------------------------------------
   */

  // CDT1 
  // ---------------------------------------------------------------------------
  it('CDT1 : Vérifier la présence du lien "Connexion" dans la Navbar', () => {
    
    // ÉTAPES :
    // 1. Accéder à l'URL du site et ouvrir le site 
    // 2. Afficher la page d'accueil
    cy.visit('http://localhost:4200/#/');

    // RÉSULTAT ATTENDU : 
    // La barre de navigation est affichée et contient le lien "Connexion"
    // Utilisation de cy.contains pour trouver le lien n'importe où dans la page
    // On attend directement que le lien "Connexion" soit visible
    cy.contains('Connexion', { timeout: 10000 }).should('be.visible');
  });

  
  // CDT2 
  // ---------------------------------------------------------------------------
  it('CDT2 : Vérifier l\'affichage de la Page de Connexion et de ses champs', () => {
    
    // ÉTAPES :
    // Depuis la Page d'Accueil, cliquer sur le lien "Connexion" dans la barre de navigation
    cy.visit('http://localhost:4200/#/');
    cy.contains('Connexion').click();

    // RÉSULTAT ATTENDU : 
    // La Page de Connexion s'affiche et contient les champs "Email" et "Mot de passe" 
    // ainsi que le bouton "Se connecter"
    cy.url().should('include', '/login');
    
    // On attend que le bouton spécifique de cette page soit là
    cy.contains('button', 'Se connecter', { timeout: 10000 }).should('be.visible');
    cy.contains('Email').should('be.visible');
    cy.contains('Mot de passe').should('be.visible');
  });
});


// =============================================================================
// BESOIN 2: L'utilisateur connecté doit pouvoir ajouter des produits au panier
// =============================================================================

describe('Besoin : Ajout au panier (Utilisateur connecté)', () => {

  /**
   * ---------------------------------------------------------------------------
   * SCÉNARIO : Vérifier la présence des boutons d’ajout au panier quand 
   * l'utilisateur est connecté afin de valider qu'il peut accéder au panier
   * ---------------------------------------------------------------------------
   */

  beforeEach(() => {
    // PRÉ-REQUIS : Connexion avec un compte valide
    // "Entrer “test2@test.fr” dans le champ de l’email, “testtest” comme mot de passe"
    cy.visit('http://localhost:4200/#/login');
    
    // On attend que les champs soient prêts avant d'écrire
    cy.get('input#username', { timeout: 10000 }).should('be.visible').type('test2@test.fr');
    cy.get('input#password').type('testtest');
    cy.contains('button', 'Se connecter').click();
    
    // Attente que la session soit établie
    cy.url().should('not.include', '/login');
  });

  // CDT1
  // ---------------------------------------------------------------------------
  it('CDT1 : Vérifier le changement des liens de navigation (Mon panier et Déconnexion) après connexion', () => {
    
    // ÉTAPES:
    // Depuis la Page d'Accueil vérifier la présence des liens "Mon panier" 
    // et "Déconnexion" dans la Navbar
    cy.visit('http://localhost:4200/#/');

    // RÉSULTAT ATTENDU : 
    // La barre de navigation est affichée et contient les liens "Mon panier" et "Déconnexion"
    cy.contains('Mon panier', { timeout: 10000 }).should('be.visible');
    cy.contains('Déconnexion').should('be.visible');
  });

  // CDT2
  // ---------------------------------------------------------------------------
  it('CDT2 : Vérifier l\'accès à la Page Produits depuis la Page d\'Accueil', () => {
    
    // ÉTAPES :
    // Depuis la Page d'Accueil vérifier :
    // => dans la Navbar : la présence du lien "Produits" 
    // => dans le body : la présence du bouton "Voir les produits"
    cy.visit('http://localhost:4200/#/');
    
    // RÉSULTAT ATTENDU : 
    // => La barre de navigation est affichée et contient le lien "Produits"
    // => Le bouton "Voir les produits" est présent dans le body du site
    cy.contains('Produits').should('be.visible');
    cy.contains('button', 'Voir les produits', { timeout: 10000 }).should('be.visible');
  });

  // CDT3 
  // ---------------------------------------------------------------------------
  it('CDT3 : Vérifier l\'accès à la page de détail de chaque produit', () => {
    
    // ÉTAPES : 
    // Depuis la Page du Produit sur les cards de tous les produits 
    // vérifier la présence des boutons "Consulter"
    cy.visit('http://localhost:4200/#/products');

    // RÉSULTAT ATTENDU : 
    // Les boutons "Consulter" s'affichent sur les cards de tous les produits
    cy.contains('Consulter', { timeout: 10000 }).should('be.visible');
  });

  // CDT4 
  // ---------------------------------------------------------------------------------------------
  it('CDT4 : Vérifier la présence des boutons "Ajouter au panier" sur les pages produits 3 à 10', () => {
    
    const ids = [3, 4, 5, 6, 7, 8, 9, 10];

    ids.forEach((id) => {
      // ÉTAPES : 
      // Depuis la Page de chaque produit vérifier que le bouton "Ajouter au panier" est présent
      cy.visit(`http://localhost:4200/#/products/${id}`);

      // RÉSULTAT ATTENDU : 
      // Le bouton "Ajouter au panier" s'affiche sur la page de détail de chaque produit
      cy.contains('button', 'Ajouter au panier', { timeout: 10000 }).should('be.visible');
    });
  });
});