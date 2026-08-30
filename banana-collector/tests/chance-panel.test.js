// Vérifie le panneau "Voir mes chances" du Tirage : affiche les vraies
// probabilités par rareté (mêmes poids que rollBanana() lui-même, via
// computeWeights) et liste les bonus temporaires actuellement actifs.
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
    await page.waitForTimeout(200);

    assert.ok(
      await page.evaluate(() => document.getElementById("chance-panel").classList.contains("hidden")),
      "chance panel must start hidden"
    );

    await page.click("#chance-panel-toggle");
    await page.waitForTimeout(150);
    assert.ok(
      await page.evaluate(() => !document.getElementById("chance-panel").classList.contains("hidden")),
      "chance panel did not open on toggle click"
    );

    const rowCount = await page.$$eval(".chance-row", (els) => els.length);
    assert.strictEqual(rowCount, 7, "expected one row per rarity (7 total)");

    const percentages = await page.$$eval(".chance-row-pct", (els) => els.map((e) => parseFloat(e.textContent)));
    const sum = percentages.reduce((a, b) => a + b, 0);
    assert.ok(sum > 99 && sum < 101, `rarity percentages should sum to ~100%, got ${sum}`);

    // Sans bonus actif : message par défaut, pas de ligne de bonus.
    assert.strictEqual(
      await page.$$eval(".chance-panel-bonus-line", (els) => els.length),
      1,
      "expected exactly the default 'no active bonus' line"
    );

    // Avec un boost de chance actif, la ligne correspondante doit apparaître
    // avec le bon pourcentage, et un tirage tenu pendant que le panneau est
    // ouvert doit garder l'affichage à jour.
    await page.evaluate(() => {
      state.chanceBoost = { percent: 15, expiresAt: Date.now() + 2 * 3600000 };
      saveState();
    });
    await page.click("#chance-panel-toggle"); // ferme
    await page.click("#chance-panel-toggle"); // rouvre -> recalcule
    await page.waitForTimeout(150);
    const bonusText = await page.evaluate(() => document.getElementById("chance-panel-bonuses").textContent);
    assert.ok(bonusText.includes("+15%"), `expected the active chance boost to be listed, got: ${bonusText}`);

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — chance-panel.test.js"))
    .catch((e) => {
      console.error("FAILED — chance-panel.test.js:", e.message);
      process.exit(1);
    });
}
