const fs = require("fs");
const { chromium } = require("playwright");

// Dans le bac à sable de développement (Claude Code on the web), Chromium
// est pré-installé à un chemin fixe et les téléchargements réseau de
// Playwright ne sont pas garantis — on pointe donc dessus explicitement
// s'il existe. Sur un poste normal ou en CI (après `npx playwright
// install`), ce chemin n'existe pas : on retombe sur la résolution par
// défaut de Playwright, qui trouve le navigateur qu'elle vient d'installer.
const SANDBOX_CHROMIUM_PATH = "/opt/pw-browsers/chromium";

async function launchChromium(options = {}) {
  if (fs.existsSync(SANDBOX_CHROMIUM_PATH)) {
    return chromium.launch({ executablePath: SANDBOX_CHROMIUM_PATH, ...options });
  }
  return chromium.launch(options);
}

module.exports = { launchChromium };
