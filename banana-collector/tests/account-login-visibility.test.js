// Régression signalée par un joueur : la connexion/création de compte était
// noyée tout en bas d'une modale "Compte" déjà longue (profil, cosmétiques,
// avatars, médailles), donc difficile à trouver. Vérifie que (1) le bouton
// d'en-tête annonce clairement qu'on peut s'y connecter quand aucun compte
// n'est lié, et (2) le formulaire de connexion/création apparaît en premier
// dans la modale, avant toute la section profil.
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");
const { skipOnboardingUi } = require("./lib/skip-onboarding");

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
    await skipOnboardingUi(page);

    // updateAccountBtn() (interne à la fermeture DOMContentLoaded, non
    // exposée) tourne déjà une fois au démarrage réel du jeu ; aucun compte
    // n'étant lié à ce stade, le bouton doit déjà porter ce libellé sans
    // rien avoir à simuler.
    const btnText = await page.$eval("#account-btn", (el) => el.textContent);
    assert.ok(btnText.includes("Connexion"), `the header button must announce the login feature when no account is linked, got: "${btnText}"`);

    // renderAccountModal() (appelée par le clic ci-dessous) relit CLOUD.available/
    // isLinked() à chaque ouverture — on force ici le cas "compte disponible
    // mais non lié" pour vérifier l'ordre du formulaire dans la modale.
    await page.evaluate(() => {
      CLOUD.available = true;
      CLOUD.isLinked = () => false;
    });
    await page.click("#account-btn");
    await page.waitForTimeout(200);

    assert.ok(await page.$("#account-username-input"), "the login/signup form must be present in the account modal");

    // Le formulaire doit précéder la section profil dans le DOM, pas venir
    // après (sinon on doit à nouveau tout faire défiler pour le trouver).
    const formComesFirst = await page.evaluate(() => {
      const form = document.querySelector(".account-form-primary");
      const profile = document.querySelector(".profile-section");
      if (!form || !profile) return false;
      // DOCUMENT_POSITION_FOLLOWING (4) sur profile signifie que profile suit form.
      return !!(form.compareDocumentPosition(profile) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    assert.ok(formComesFirst, "the login/signup form must appear before the profile section, not after it");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — account-login-visibility.test.js"))
    .catch((e) => {
      console.error("FAILED — account-login-visibility.test.js:", e.message);
      process.exit(1);
    });
}
