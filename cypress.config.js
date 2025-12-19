const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:4200', 
    
    // Variables d'environnement pour l'API Backend (Docker)
    env: {
      API_URL: 'http://localhost:8081', // L'API Docker
      TEST_EMAIL: 'test2@test.fr',
      TEST_PASSWORD: 'testtest',
    },

    setupNodeEvents(on, config) {
      // Événements du nœud de configuration (je laisse vide pour l'instant)
    },
    
    // Augmente le temps d'attente par défaut pour éviter les timeouts
    defaultCommandTimeout: 10000, 
  },
});