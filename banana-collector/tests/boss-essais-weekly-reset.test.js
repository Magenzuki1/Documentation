// Garde-fou pour une régression déjà rencontrée : le niveau affiché de
// l'amélioration "Essais de Boss" doit retomber à 0 dès qu'une nouvelle
// semaine de Boss démarre (l'amélioration se rachète chaque semaine), sans
// quoi l'affichage local resterait figé sur un niveau que le serveur a déjà
// remis à zéro. Vérifié via l'ouverture réelle de l'onglet Combat (pas
// d'appel direct à syncBossEssaisWeeklyReset, qui vit dans la fermeture
// interne de ui.js et n'est pas exposée globalement).
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

    await page.evaluate(() => {
      // Simule un niveau acheté la semaine dernière, jamais remis à zéro
      // localement — c'est exactement ce que renderBossTab() doit corriger.
      state.upgrades.bossessais = 3;
      state.bossEssaisWeekKey = "w-semaine-precedente";
      saveState();

      CLOUD.available = true;
      CLOUD.isLinked = () => true;
      CLOUD.pushAll = async () => {};
      CLOUD.setBossAttemptsBonus = async () => {};
      CLOUD.fetchUnseenBossGiftCount = async () => 0;
      CLOUD.fetchUnclaimedGiftCount = async () => 0;
      CLOUD.fetchSeasonPassTiers = async () => [];
      CLOUD.getMySeasonStatus = async () => null;
      CLOUD.getWeeklyBoss = async () => ({
        week_key: "w-nouvelle-semaine",
        name: "Boss de test",
        emoji: "👹",
        current_hp: 500,
        max_hp: 1000,
        defeated_at: null,
        sunday_boost_applied_at: null,
      });
      CLOUD.getMyWeeklyBossStatus = async () => ({
        my_rank: null,
        attempts_used_today: 0,
        attempts_allowed_today: 3,
        total_damage_this_week: 0,
      });
    });

    await page.click('[data-tab="combat"]');
    await page.click("#combat-tab-boss");
    await page.waitForTimeout(500);

    const after = await page.evaluate(() => ({
      bossessais: state.upgrades.bossessais,
      weekKey: state.bossEssaisWeekKey,
    }));
    assert.strictEqual(after.bossessais, 0, "bossessais level must reset to 0 on a new boss week");
    assert.strictEqual(after.weekKey, "w-nouvelle-semaine", "bossEssaisWeekKey must be updated to the new week");
    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);

    // Une deuxième ouverture sur la MÊME semaine ne doit plus rien changer
    // (pas de double reset intempestif si le joueur rachète le niveau puis
    // revient sur l'onglet).
    await page.evaluate(() => {
      state.upgrades.bossessais = 2;
      saveState();
    });
    await page.click('[data-tab="progression"]');
    await page.click('[data-tab="combat"]');
    await page.click("#combat-tab-boss");
    await page.waitForTimeout(500);
    const stillTwo = await page.evaluate(() => state.upgrades.bossessais);
    assert.strictEqual(stillTwo, 2, "re-opening the tab on the same week must not reset a freshly bought level");
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — boss-essais-weekly-reset.test.js"))
    .catch((e) => {
      console.error("FAILED — boss-essais-weekly-reset.test.js:", e.message);
      process.exit(1);
    });
}
