import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    // 1. URL de base de l'application (Frontend Angular)
    // Permet d'utiliser cy.visit('/') au lieu de l'URL complète
    baseUrl: 'http://localhost:4200', 
    
    // 2. Temps d'attente global (10 secondes) pour éviter les timeouts
    defaultCommandTimeout: 10000, 

    // 3. Taille de la fenêtre (Desktop) pour garantir la visibilité de la barre de navigation
    viewportWidth: 1280,
    viewportHeight: 720,

    // 4. Désactivation de la sécurité web (utile pour les redirections locales)
    chromeWebSecurity: false,

    setupNodeEvents(on, config) {
      // Emplacement pour d'éventuels plugins ou configurations avancées
      return config;
    },
    // On s'assure que Cypress cherche bien les fichiers .ts
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}'
  },

  // 5. Variables d'environnement et Constantes
  // Accessibles dans les tests via Cypress.env('nom_de_la_variable')
  env: {
    apiUrl: 'http://localhost:8081', // URL de l'API Backend (Docker)
    userEmail: 'test2@test.fr',     // Identifiant pour les tests
    userPassword: 'testtest',        // Mot de passe pour les tests
    firstName: 'John',
    lastName: 'Doe',
    address: '123 Rue Principale',
    city: 'Paris',
    zipCode: '75001'
  }
});
