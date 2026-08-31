// Sur une fenêtre de bureau large mais courte en hauteur, l'onglet Tirage
// (conçu pour un écran de téléphone haut et étroit) obligeait à faire
// défiler pour tout voir — signalé par un joueur sur PC. À partir d'un
// certain seuil de largeur (voir le @media dans style.css), le fil
// d'actualité et le bandeau de l'événement du jour passent côte à côte, les
// panneaux Niveau/Collection s'aplatissent, et le choix "Animation de
// récolte" quitte le fil principal pour un interrupteur compact dans
// l'en-tête. En dessous du seuil, la mise en page mobile reste identique.
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

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);
    await skipOnboardingUi(page);

    const isVisible = (sel) => page.evaluate((s) => {
      const el = document.querySelector(s);
      return !!el && getComputedStyle(el).display !== "none";
    }, sel);

    // Grand écran : la file compacte est active.
    assert.ok(await isVisible("#roll-mode-icon-btn"), "l'icône compacte doit être visible en grand écran");
    assert.strictEqual(await isVisible(".roll-mode-bar"), false, "la barre complète doit être masquée en grand écran");
    const rowDisplay = await page.evaluate(() => getComputedStyle(document.querySelector(".topbar-secondary-row")).display);
    assert.strictEqual(rowDisplay, "flex", "le fil d'actualité et le bandeau du jour doivent être en ligne en grand écran");

    // L'icône reflète l'état courant et le fait basculer correctement.
    const initiallyAnimated = await page.evaluate(() => !!state.settings.animatedRoll);
    assert.strictEqual(
      await page.evaluate(() => document.getElementById("roll-mode-icon-btn").classList.contains("animated")),
      initiallyAnimated,
      "l'icône doit refléter l'état au chargement"
    );
    await page.click("#roll-mode-icon-btn");
    await page.waitForTimeout(100);
    assert.strictEqual(
      await page.evaluate(() => state.settings.animatedRoll),
      !initiallyAnimated,
      "un clic sur l'icône doit inverser le mode"
    );

    // Le réglage complet (masqué mais toujours dans le DOM) reste synchronisé,
    // preuve que les deux widgets partagent bien le même état plutôt que
    // deux réglages indépendants qui pourraient diverger.
    const barBtnId = (await page.evaluate(() => state.settings.animatedRoll))
      ? "settings-roll-animated-btn"
      : "settings-roll-fast-btn";
    assert.ok(
      await page.evaluate((id) => document.getElementById(id).classList.contains("active"), barBtnId),
      "la barre complète (masquée) doit rester synchronisée avec l'icône"
    );

    // Repasse en largeur mobile : la mise en page redevient celle d'avant.
    await page.setViewportSize({ width: 420, height: 900 });
    await page.waitForTimeout(100);
    assert.strictEqual(await isVisible("#roll-mode-icon-btn"), false, "l'icône compacte doit disparaître sous le seuil");
    assert.ok(await isVisible(".roll-mode-bar"), "la barre complète doit réapparaître sous le seuil");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — desktop-compact-layout.test.js"))
    .catch((e) => {
      console.error("FAILED — desktop-compact-layout.test.js:", e.message);
      process.exit(1);
    });
}
