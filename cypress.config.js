import { defineConfig } from "cypress";
import { execSync } from "child_process";

let didResetForRun = false;

function resetDockerDb() {
  console.log("Reset DB (Docker + bind mount ./mysql)");

  // Stop containers
  execSync("docker compose down", { stdio: "inherit" });

  // Reset bind mount local (down -v ne le supprime pas)
  execSync("rm -rf ./mysql && mkdir ./mysql", { stdio: "inherit" });

  // Restart containers (réimporte le dump depuis ./data via init scripts)
  execSync("docker compose up -d", { stdio: "inherit" });

  // Attente que l’API soit réellement up
  try {
    execSync(
      `bash -lc 'for i in {1..30}; do curl -sf http://localhost:8081/api/health >/dev/null && exit 0; echo "Attente API..."; sleep 1; done; exit 1'`,
      { stdio: "inherit" }
    );
  } catch (e) {
    throw new Error("API non prête après reset DB.");
  }
}

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4200",
    defaultCommandTimeout: 10000,
    viewportWidth: 1280,
    viewportHeight: 720,
    chromeWebSecurity: false,

    setupNodeEvents(on, config) {
      // Campagne complète (CI / soutenance) : reset 1 fois au démarrage
      on("before:run", () => {
        didResetForRun = true;
        resetDockerDb();
      });

      /**
       * Mode interactif (cypress open) : pas de before:run
       * → on reset au lancement de chaque spec.
       *
       * En mode `cypress run`, `before:spec` est aussi déclenché.
       * Pour éviter un double reset inutile, on ne reset pas ici si on vient
       * déjà de reset via before:run.
       */
      on("before:spec", () => {
        if (!didResetForRun) {
          resetDockerDb();
        }
      });

      // Sécurité : en fin de run, on remet le flag à zéro
      on("after:run", () => {
        didResetForRun = false;
      });

      return config;
    },

    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
  },

  env: {
    apiUrl: "http://localhost:8081",
    userEmail: "test2@test.fr",
    userPassword: "testtest",
    firstName: "John",
    lastName: "Doe",
    address: "123 Rue Principale",
    city: "Paris",
    zipCode: "75001",
    registerFirstName: "Elena",
    registerLastName: "Kitanova",
    registerPassword: "Ecobliss4",
  },
});