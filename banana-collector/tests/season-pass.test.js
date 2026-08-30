// Vérifie la logique du Passe saisonnier : accumulation de points par
// action (tirage, minijeux, Arène solo/PVP, Boss), réinitialisation au
// changement de mois, et le flux de réclamation d'un palier dans la modale
// (médaille et boost de chance appliqués à l'état local).
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");
const { skipOnboardingUi } = require("./lib/skip-onboarding");

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await skipOnboardingUi(page);

    const logic = await page.evaluate(() => {
      const out = {};
      state.seasonPass = { points: 0, seasonKey: null };
      addSeasonPoints(2);
      addSeasonPoints(3);
      out.afterTwoAdds = { ...state.seasonPass };

      state.seasonPass.seasonKey = "2000-01";
      state.seasonPass.points = 999999;
      addSeasonPoints(10);
      out.afterStaleReset = { ...state.seasonPass };

      out.currentKeyMatchesNow =
        currentSeasonKey() === `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, "0")}`;
      return out;
    });
    assert.strictEqual(logic.afterTwoAdds.points, 5, "addSeasonPoints: expected 5 after +2+3");
    assert.ok(logic.afterTwoAdds.seasonKey, "addSeasonPoints did not set seasonKey");
    assert.strictEqual(logic.afterStaleReset.points, 10, "a stale season key must reset points, not accumulate");
    assert.ok(logic.currentKeyMatchesNow, "currentSeasonKey() must match the real UTC year-month");

    const hooks = await page.evaluate(() => {
      state.seasonPass = { points: 0, seasonKey: currentSeasonKey() };
      const points = [state.seasonPass.points];
      rollBanana();
      points.push(state.seasonPass.points);
      resolveBlackjackBet(100, "victoire");
      points.push(state.seasonPass.points);
      resolveSlotSpin({ lineWins: [], hasJackpotLine: false, bonusTriggered: false }, 10);
      points.push(state.seasonPass.points);
      awardCatchGameResult(3, 0);
      points.push(state.seasonPass.points);
      awardMemoryGameResult("normal", 20, 15000);
      points.push(state.seasonPass.points);
      return points;
    });
    for (let i = 1; i < hooks.length; i++) {
      assert.ok(hooks[i] > hooks[i - 1], `season points must increase after each action (step ${i}): ${hooks}`);
    }

    // Victoire en Arène solo (PvE) : +5 points. Math.random forcé à 0 pour
    // garantir une victoire quel que soit winChance (toujours > 0 par design).
    const pveDelta = await page.evaluate(() => {
      if (state.discovered.length === 0) rollBanana();
      state.seasonPass = { points: 0, seasonKey: currentSeasonKey() };
      const realRandom = Math.random;
      Math.random = () => 0;
      try {
        const result = fightFruitEnemy(state.discovered[0], state.pve.stage);
        if (!result.won) throw new Error("forced win via Math.random=0 did not win — winChance must be 0");
      } finally {
        Math.random = realRandom;
      }
      return state.seasonPass.points;
    });
    assert.strictEqual(pveDelta, 5, `expected +5 season points for a solo arena win, got ${pveDelta}`);

    // Victoire en Arène PVP (multi) : +8 points, via le vrai flux UI
    // (trouver un adversaire puis attaquer), CLOUD mocké.
    await page.evaluate(() => {
      state.seasonPass = { points: 0, seasonKey: currentSeasonKey() };
      CLOUD.available = true;
      CLOUD.isLinked = () => true;
      CLOUD.myPvpRating = () => 1000;
      CLOUD.setMyPvpRating = () => {};
      CLOUD.findOpponent = async () => ({ ok: true, defenderId: "opp-1", username: "adversaire", avatarId: null, power: 10, rating: 1000 });
      CLOUD.attackPlayer = async () => ({
        ok: true,
        won: true,
        attackerDelta: 50,
        attackerRatingAfter: 1010,
        attackerRatingDelta: 10,
      });
      CLOUD.scheduleSync = () => {};
    });
    await page.click('[data-tab="combat"]');
    await page.click("#combat-tab-pvp");
    await page.click("#pvp-find-btn");
    await page.waitForTimeout(300);
    await page.click("#pvp-attack-btn");
    await page.waitForTimeout(300);
    const pvpPoints = await page.evaluate(() => state.seasonPass.points);
    assert.strictEqual(pvpPoints, 8, `expected +8 season points for a PVP arena win, got ${pvpPoints}`);

    await page.evaluate(() => {
      CLOUD.available = true;
      CLOUD.isLinked = () => true;
      CLOUD.fetchSeasonPassTiers = async () => [
        { tier: 1, threshold: 100, coins: 500, banana_rarity: "commune", banana_qty: 3, medal_id: null, chance_boost_percent: 0, chance_boost_hours: 0 },
        { tier: 5, threshold: 800, coins: 2000, banana_rarity: "peu_commune", banana_qty: 4, medal_id: "medal_season_1", chance_boost_percent: 0, chance_boost_hours: 0 },
        { tier: 7, threshold: 1300, coins: 1000, banana_rarity: null, banana_qty: 0, medal_id: null, chance_boost_percent: 10, chance_boost_hours: 3 },
      ];
      CLOUD.getMySeasonStatus = async () => ({ season_key: "2026-08", points: 1400, days_remaining: 2, claimed_tiers: [1] });
      CLOUD.claimSeasonTier = async (tier) => {
        if (tier === 5) return { ok: true, coins: 2000, bananaIds: [28, 28, 28, 30], medalId: "medal_season_1", chanceBoostPercent: 0, chanceBoostHours: 0 };
        if (tier === 7) return { ok: true, coins: 1000, bananaIds: [], medalId: null, chanceBoostPercent: 10, chanceBoostHours: 3 };
        return { ok: false, reason: "unexpected" };
      };
    });

    await page.click("#season-pass-btn");
    await page.waitForTimeout(300);
    assert.ok(
      await page.evaluate(() => !document.getElementById("season-pass-modal").classList.contains("hidden")),
      "season pass modal did not open"
    );
    assert.strictEqual(await page.$$eval(".season-tier", (els) => els.length), 3, "expected 3 tier rows rendered");
    assert.strictEqual(await page.$$eval(".season-tier-claimed", (els) => els.length), 1, "expected exactly 1 claimed tier");
    assert.strictEqual(await page.$$eval("[data-claim-tier]", (els) => els.length), 2, "expected 2 claimable tiers");

    await page.click('[data-claim-tier="5"]');
    await page.waitForTimeout(400);
    assert.ok(
      await page.evaluate(() => state.medals.unlocked.includes("medal_season_1")),
      "medal_season_1 was not applied to local state after claiming tier 5"
    );

    // La récompense contenait 4 bananes mais seulement 2 distinctes
    // (28 x3, 30 x1) : la révélation groupée doit montrer 2 cartes, pas 4,
    // avec la bonne rareté marquée "NOUVEAU" (aucune des deux n'était
    // découverte avant).
    assert.ok(
      await page.evaluate(() => !document.getElementById("reveal-modal").classList.contains("hidden")),
      "reveal modal did not open after claiming a tier with bananas"
    );
    assert.strictEqual(await page.$$eval(".reveal-grid-card", (els) => els.length), 2, "expected 2 distinct banana cards in the reveal");
    assert.strictEqual(await page.$$eval(".reveal-grid-card .new-badge", (els) => els.length), 2, "expected both distinct bananas marked as new");
    await page.click("#reveal-modal-close");
    assert.ok(
      await page.evaluate(() => document.getElementById("reveal-modal").classList.contains("hidden")),
      "reveal modal close button did not hide it"
    );

    await page.click('[data-claim-tier="7"]');
    await page.waitForTimeout(400);
    const boost = await page.evaluate(() => state.chanceBoost);
    assert.strictEqual(boost.percent, 10, "chance boost percent not applied");
    assert.ok(boost.expiresAt > Date.now(), "chance boost expiresAt not set in the future");

    await page.click("#season-pass-close");
    assert.ok(
      await page.evaluate(() => document.getElementById("season-pass-modal").classList.contains("hidden")),
      "close button did not hide the modal"
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
    .then(() => console.log("OK — season-pass.test.js"))
    .catch((e) => {
      console.error("FAILED — season-pass.test.js:", e.message);
      process.exit(1);
    });
}
