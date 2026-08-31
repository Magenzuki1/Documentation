// Vérifie que le choix "Animation de récolte" est bien à côté du bouton de
// récolte (onglet Tirage) plutôt que caché dans la modale Compte : il doit
// être visible sans ouvrir quoi que ce soit, refléter l'état courant, être
// cliquable, et le choix doit survivre à un rechargement.
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");
const { skipOnboardingUi } = require("./lib/skip-onboarding");

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    // Ce test vérifie la mise en page MOBILE (la barre complète à côté du
    // bouton de récolte) ; sans largeur explicite, Playwright utilise sa
    // fenêtre par défaut (1280px), au-dessus du seuil où le @media dans
    // style.css bascule sur l'icône compacte de l'en-tête à la place — voir
    // desktop-compact-layout.test.js pour ce cas-là.
    await page.setViewportSize({ width: 420, height: 1000 });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
    await skipOnboardingUi(page);

    // Les deux boutons sont visibles d'emblée, dans l'onglet d'accueil (Tirage), après le
    // bouton de récolte (donc "à côté" au sens de la lecture de la page).
    for (const id of ["settings-roll-animated-btn", "settings-roll-fast-btn"]) {
      assert.ok(await page.isVisible(`#${id}`), `#${id} devrait être visible sans ouvrir de modale`);
    }
    const placement = await page.evaluate(() => {
      const harvest = document.getElementById("harvest-btn");
      const btn = document.getElementById("settings-roll-animated-btn");
      const home = document.getElementById("tab-accueil");
      return {
        inHomeTab: !!(home && home.contains(btn)),
        afterHarvest: !!(harvest.compareDocumentPosition(btn) & Node.DOCUMENT_POSITION_FOLLOWING),
      };
    });
    assert.ok(placement.inHomeTab, "le réglage doit vivre dans l'onglet d'accueil (Tirage)");
    assert.ok(placement.afterHarvest, "le réglage doit se trouver juste après le bouton de récolte");

    // L'état affiché suit state.settings.animatedRoll.
    const initiallyAnimated = await page.evaluate(() => !!state.settings.animatedRoll);
    assert.strictEqual(
      await page.evaluate(() => document.getElementById("settings-roll-animated-btn").classList.contains("active")),
      initiallyAnimated,
      "le bouton actif doit refléter l'état au chargement"
    );

    // Bascule en mode rapide puis en mode animé.
    await page.click("#settings-roll-fast-btn");
    await page.waitForTimeout(100);
    assert.strictEqual(await page.evaluate(() => state.settings.animatedRoll), false, "clic 'rapide' doit désactiver l'animation");
    assert.ok(
      await page.evaluate(() => document.getElementById("settings-roll-fast-btn").classList.contains("active")),
      "le bouton 'rapide' doit devenir actif"
    );

    // Le choix est persisté et re-rendu après rechargement (pas seulement en mémoire).
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(250);
    assert.strictEqual(await page.evaluate(() => state.settings.animatedRoll), false, "le choix doit survivre au rechargement");
    assert.ok(
      await page.evaluate(() => document.getElementById("settings-roll-fast-btn").classList.contains("active")),
      "après rechargement, le bouton 'rapide' doit encore être marqué actif"
    );

    await page.click("#settings-roll-animated-btn");
    await page.waitForTimeout(100);
    assert.strictEqual(await page.evaluate(() => state.settings.animatedRoll), true, "clic 'animé' doit réactiver l'animation");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — roll-mode-placement.test.js"))
    .catch((e) => {
      console.error("FAILED — roll-mode-placement.test.js:", e.message);
      process.exit(1);
    });
}
