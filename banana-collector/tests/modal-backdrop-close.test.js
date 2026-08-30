// Vérifie qu'un clic en dehors de la boîte de dialogue ferme les nouvelles
// fenêtres ajoutées cette saison (Passe saisonnier, boîte à cadeaux,
// révélation groupée) — comme les fenêtres existantes (Compte, Paramètres),
// où ce comportement était déjà en place.
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(700);

    await page.evaluate(() => {
      CLOUD.available = true;
      CLOUD.isLinked = () => true;
      CLOUD.fetchSeasonPassTiers = async () => [];
      CLOUD.getMySeasonStatus = async () => ({ season_key: "2026-08", points: 0, days_remaining: 2, claimed_tiers: [] });
      CLOUD.fetchPendingGifts = async () => [];
      CLOUD.fetchBossGifts = async () => [];
      CLOUD.markBossGiftsSeen = async () => {};
    });

    // Passe saisonnier : ouvre, clique sur le fond (hors de la boîte), doit se fermer.
    await page.click("#season-pass-btn");
    await page.waitForTimeout(300);
    assert.ok(await page.evaluate(() => !document.getElementById("season-pass-modal").classList.contains("hidden")), "season pass modal did not open");
    await page.mouse.click(5, 5);
    await page.waitForTimeout(150);
    assert.ok(await page.evaluate(() => document.getElementById("season-pass-modal").classList.contains("hidden")), "clicking the backdrop must close the season pass modal");

    // Un clic à l'intérieur de la boîte, lui, ne doit PAS la fermer.
    await page.click("#season-pass-btn");
    await page.waitForTimeout(300);
    await page.click(".season-pass-modal-box h2");
    await page.waitForTimeout(150);
    assert.ok(await page.evaluate(() => !document.getElementById("season-pass-modal").classList.contains("hidden")), "clicking inside the modal box must not close it");
    await page.click("#season-pass-close");

    // Boîte à cadeaux : même comportement.
    await page.click("#gift-box-btn");
    await page.waitForTimeout(300);
    assert.ok(await page.evaluate(() => !document.getElementById("gift-box-modal").classList.contains("hidden")), "gift box modal did not open");
    await page.mouse.click(5, 5);
    await page.waitForTimeout(150);
    assert.ok(await page.evaluate(() => document.getElementById("gift-box-modal").classList.contains("hidden")), "clicking the backdrop must close the gift box modal");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — modal-backdrop-close.test.js"))
    .catch((e) => {
      console.error("FAILED — modal-backdrop-close.test.js:", e.message);
      process.exit(1);
    });
}
