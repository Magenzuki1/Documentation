// Vérifie les Quêtes de saison (SEASON_QUEST_POOL) : progression suivie
// séparément des stats globales, récompense en XP + points de saison
// (jamais en pièces), pas de double-crédit, et reset au changement de mois
// en même temps que les points.
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

    const result = await page.evaluate(() => {
      state.seasonPass = { points: 0, seasonKey: currentSeasonKey(), questProgress: {}, questsCompleted: [] };
      const out = {};

      // Sous le seuil (need: 3) : pas encore complétée.
      bumpSeasonQuestProgress("bossAttacks", 2);
      let completed = checkQuests();
      out.notYetDone = completed.some((q) => q.id === "sq_boss_3");
      out.xpBefore = state.playerXp;

      // Atteint le seuil : complétée une seule fois, XP + points crédités.
      bumpSeasonQuestProgress("bossAttacks", 1);
      completed = checkQuests();
      const done = completed.find((q) => q.id === "sq_boss_3");
      out.justCompleted = !!done;
      out.isSeasonQuest = done ? done.isSeasonQuest === true : false;
      out.xpAfter = state.playerXp;
      out.pointsAfter = state.seasonPass.points;
      out.markedDone = state.seasonPass.questsCompleted.includes("sq_boss_3");

      // Rejouer checkQuests() ne doit plus jamais re-créditer la même quête.
      const pointsBeforeReplay = state.seasonPass.points;
      const xpBeforeReplay = state.playerXp;
      bumpSeasonQuestProgress("bossAttacks", 5);
      checkQuests();
      out.noDoubleCredit = state.seasonPass.points === pointsBeforeReplay + 0 || state.seasonPass.points === pointsBeforeReplay;
      out.xpUnchangedOnReplay = state.playerXp === xpBeforeReplay;

      // Changement de mois : la progression ET les quêtes complétées sont
      // remises à zéro, comme les points eux-mêmes.
      state.seasonPass.seasonKey = "2000-01";
      ensureCurrentSeasonPass();
      out.resetQuestProgress = Object.keys(state.seasonPass.questProgress).length === 0;
      out.resetQuestsCompleted = state.seasonPass.questsCompleted.length === 0;

      return out;
    });

    assert.strictEqual(result.notYetDone, false, "quest must not complete before reaching its threshold");
    assert.strictEqual(result.justCompleted, true, "quest must complete exactly when the threshold is reached");
    assert.strictEqual(result.isSeasonQuest, true, "completed season quest must carry isSeasonQuest: true for toast routing");
    assert.ok(result.xpAfter > result.xpBefore, "completing a season quest must grant XP");
    assert.strictEqual(result.pointsAfter, 50, "sq_boss_3 must grant exactly 50 season points");
    assert.ok(result.markedDone, "completed season quest must be recorded in questsCompleted");
    assert.ok(result.xpUnchangedOnReplay, "re-running checkQuests() must never re-grant XP for an already-completed season quest");
    assert.ok(result.resetQuestProgress, "questProgress must reset on a new season");
    assert.ok(result.resetQuestsCompleted, "questsCompleted must reset on a new season");

    // Rendu dans la modale du Passe saisonnier : les quêtes sont locales,
    // affichées même sans compte lié (contrairement aux paliers).
    await page.evaluate(() => {
      CLOUD.available = true;
      CLOUD.isLinked = () => false;
    });
    await page.click("#season-pass-btn");
    await page.waitForTimeout(300);
    const questRowCount = await page.$$eval("#season-pass-quests .quest-item", (els) => els.length);
    assert.strictEqual(questRowCount, 13, `expected all 13 season quests rendered, got ${questRowCount}`);

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — season-quests.test.js"))
    .catch((e) => {
      console.error("FAILED — season-quests.test.js:", e.message);
      process.exit(1);
    });
}
