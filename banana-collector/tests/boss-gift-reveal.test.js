// Vérifie que le reçu de récompense du Boss dans la boîte à cadeaux permet
// de voir quelles bananes précises ont été obtenues (pas juste la rareté),
// et que les anciens reçus sans banana_ids (distribués avant l'ajout de
// cette colonne) restent affichables sans bouton détail ni erreur.
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

    await page.evaluate(() => {
      CLOUD.available = true;
      CLOUD.isLinked = () => true;
      CLOUD.fetchPendingGifts = async () => [];
      CLOUD.fetchBossGifts = async () => [
        {
          week_key: "w-1",
          rank: 1,
          coins: 125000,
          banana_rewards: { commune: 3, rare: 1 },
          banana_ids: [1, 1, 45],
          created_at: new Date().toISOString(),
          seen_at: null,
        },
        {
          // Reçu historique, distribué avant l'ajout de banana_ids.
          week_key: "w-0",
          rank: 4,
          coins: 40000,
          banana_rewards: { commune: 2 },
          banana_ids: null,
          created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
          seen_at: new Date().toISOString(),
        },
      ];
      CLOUD.markBossGiftsSeen = async () => {};
    });

    await page.click("#gift-box-btn");
    await page.waitForTimeout(300);

    assert.strictEqual(await page.$$eval(".boss-gift-detail-btn", (els) => els.length), 1, "expected exactly 1 gift with a detail button (only the one with banana_ids)");

    await page.click(".boss-gift-detail-btn");
    await page.waitForTimeout(300);
    assert.ok(
      await page.evaluate(() => !document.getElementById("reveal-modal").classList.contains("hidden")),
      "reveal modal did not open from the boss gift history"
    );
    assert.strictEqual(await page.$$eval(".reveal-grid-card", (els) => els.length), 2, "expected 2 distinct bananas (id 1 x2, id 45 x1)");
    assert.strictEqual(
      await page.$$eval(".reveal-grid-card .new-badge", (els) => els.length),
      0,
      "a historical boss gift reveal must never show a NOUVEAU badge"
    );

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — boss-gift-reveal.test.js"))
    .catch((e) => {
      console.error("FAILED — boss-gift-reveal.test.js:", e.message);
      process.exit(1);
    });
}
