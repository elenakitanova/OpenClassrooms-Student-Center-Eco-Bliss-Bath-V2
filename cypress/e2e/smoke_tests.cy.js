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
    // 1. Accéder à l'URL du site via la baseUrl configurée
    // 2. Afficher la page d'accueil
    cy.visit('/#/');

    // RÉSULTAT ATTENDU : 
    // La barre de navigation est affichée et contient le lien "Connexion"
    // Le timeout est maintenant géré globalement par la configuration Cypress
    cy.contains('Connexion').should('be.visible');
  });

  
  // CDT2 
  // ---------------------------------------------------------------------------
  it('CDT2 : Vérifier l\'affichage de la Page de Connexion et de ses champs', () => {
    
    // ÉTAPES :
    // Depuis la Page d'Accueil (URL relative), cliquer sur le lien "Connexion"
    cy.visit('/#/');
    cy.contains('Connexion').click();

    // RÉSULTAT ATTENDU : 
    // La Page de Connexion s'affiche et contient les champs "Email" et "Mot de passe" 
    // ainsi que le bouton "Se connecter"
    cy.url().should('include', '/login');
    
    // Vérification des éléments de la page
    cy.contains('button', 'Se connecter').should('be.visible');
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
    // PRÉ-REQUIS : Connexion en utilisant les variables d'environnement du fichier config
    // Utilisation de Cypress.env() pour récupérer les identifiants de test
    cy.visit('/#/login');
    
    // Saisie des identifiants récupérés depuis la configuration
    cy.get('input#username').should('be.visible').type(Cypress.env('userEmail'));
    cy.get('input#password').type(Cypress.env('userPassword'));
    cy.contains('button', 'Se connecter').click();
    
    // Attente que la session soit établie
    cy.url().should('not.include', '/login');
  });

  // CDT1
  // ---------------------------------------------------------------------------
  it('CDT1 : Vérifier le changement des liens de navigation (Mon panier et Déconnexion) après connexion', () => {
    
    // ÉTAPES:
    // Accéder à la racine du site (baseUrl) et vérifier les liens de session
    cy.visit('/#/');

    // RÉSULTAT ATTENDU : 
    // La barre de navigation contient les liens réservés aux membres connectés
    cy.contains('Mon panier').should('be.visible');
    cy.contains('Déconnexion').should('be.visible');
  });

  // CDT2
  // ---------------------------------------------------------------------------
  it('CDT2 : Vérifier l\'accès à la Page Produits depuis la Page d\'Accueil', () => {
    
    // ÉTAPES :
    // Depuis la Page d'Accueil vérifier la navigation vers les produits
    cy.visit('/#/');
    
    // RÉSULTAT ATTENDU : 
    // Présence des points d'entrée vers le catalogue produits
    cy.contains('Produits').should('be.visible');
    cy.contains('button', 'Voir les produits').should('be.visible');
  });

  // CDT3 
  // ---------------------------------------------------------------------------
  it('CDT3 : Vérifier l\'accès à la page de détail de chaque produit', () => {
    
    // ÉTAPES : 
    // Accès direct à la liste des produits via le chemin relatif
    cy.visit('/#/products');

    // RÉSULTAT ATTENDU : 
    // Les boutons "Consulter" sont présents sur les fiches produits
    cy.contains('Consulter').should('be.visible');
  });

  // CDT4 
  // ---------------------------------------------------------------------------------------------
  it('CDT4 : Vérifier la présence des boutons "Ajouter au panier" sur les pages produits 3 à 10', () => {
    
    const ids = [3, 4, 5, 6, 7, 8, 9, 10];

    ids.forEach((id) => {
      // ÉTAPES : 
      // Navigation dynamique vers chaque produit en utilisant la baseUrl
      cy.visit(`/#/products/${id}`);

      // RÉSULTAT ATTENDU : 
      // Le bouton d'action est disponible pour l'utilisateur connecté
      cy.contains('button', 'Ajouter au panier').should('be.visible');
    });
  });
});