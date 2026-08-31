// Synchronisation par compte du RESTE de la progression (XP, prestige,
// boutique, quêtes, niveaux de banane, minijeux, Passe saisonnier, onglets
// débloqués...) — tout ce qui ne vivait qu'en local et repartait donc vide
// sur un autre appareil.
//
// La règle vérifiée ici est la plus importante du fichier : la fusion se
// fait par MAXIMUM/UNION, jamais par écrasement. Un appareil en retard ne
// doit jamais pouvoir faire reculer une progression réalisée ailleurs —
// c'est exactement le piège qui a déjà coûté à des joueurs leurs achats du
// Marché et leur Arène solo.
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
    await page.waitForTimeout(300);

    // --- Un appareil EN RETARD ne doit rien faire reculer ------------------
    const stale = await page.evaluate(() => {
      state.playerXp = 5000;
      state.prestige.level = 4;
      state.upgrades.panier = 7;
      state.bananaLevels = { 1: 30 };
      state.totalRolls = 900;
      state.tabsUnlocked = ["economie", "combat", "social"];
      state.permanentQuests.completed = ["pq_a", "pq_b"];
      state.market.purchases = 12;
      state.catchGame.bestScore = 88;
      state.memoryGame.bestMoves = 14;
      saveState();

      // Un état serveur volontairement plus PAUVRE partout (appareil resté
      // en arrière, ou première synchro d'un compte peu joué ailleurs).
      mergeRemoteState({
        v: 1,
        nums: { playerXp: 10, totalRolls: 3 },
        upgrades: { panier: 1 },
        bananaLevels: { 1: 2 },
        prestigeLevel: 0,
        permanentQuests: { completed: ["pq_a"] },
        market: { purchases: 1 },
        catchGame: { bestScore: 5 },
        memoryGame: { bestMoves: 99 },
        tabsUnlocked: ["economie"],
      });

      return {
        xp: state.playerXp,
        prestige: state.prestige.level,
        panier: state.upgrades.panier,
        bananaLevel1: state.bananaLevels[1],
        totalRolls: state.totalRolls,
        tabs: state.tabsUnlocked.slice().sort(),
        permanent: state.permanentQuests.completed.slice().sort(),
        purchases: state.market.purchases,
        catchBest: state.catchGame.bestScore,
        memoryBestMoves: state.memoryGame.bestMoves,
      };
    });

    assert.strictEqual(stale.xp, 5000, "a poorer remote state must never lower local XP");
    assert.strictEqual(stale.prestige, 4, "a poorer remote state must never lower the prestige level");
    assert.strictEqual(stale.panier, 7, "a poorer remote state must never lower a shop upgrade");
    assert.strictEqual(stale.bananaLevel1, 30, "a poorer remote state must never lower a banana level");
    assert.strictEqual(stale.totalRolls, 900, "a poorer remote state must never lower a cumulative counter");
    assert.deepStrictEqual(stale.tabs, ["combat", "economie", "social"], "unlocked tabs must never be taken away");
    assert.deepStrictEqual(stale.permanent, ["pq_a", "pq_b"], "completed permanent quests must never be taken away");
    assert.strictEqual(stale.purchases, 12, "market counters must never go down");
    assert.strictEqual(stale.catchBest, 88, "a minigame best score must never go down");
    assert.strictEqual(stale.memoryBestMoves, 14, "a Memory best (lower is better) must keep the better of the two");

    // --- Un appareil EN AVANCE doit bien rapatrier sa progression ---------
    const richer = await page.evaluate(() => {
      const changed = mergeRemoteState({
        v: 1,
        nums: { playerXp: 99999, totalRolls: 4000 },
        upgrades: { panier: 9, cosmique: 3 },
        bananaLevels: { 1: 50, 7: 12 },
        // Même niveau de Prestige que le local (laissé à 4 par le scénario
        // précédent) : on est bien dans le cas "même manche, l'autre appareil
        // a juste plus avancé". Un Prestige de niveau différent a ses propres
        // scénarios dédiés plus bas.
        prestigeLevel: 4,
        permanentQuests: { completed: ["pq_c"] },
        market: { purchases: 40 },
        catchGame: { bestScore: 500 },
        memoryGame: { bestMoves: 6, bestTimeMs: 1000 },
        tabsUnlocked: ["bilan"],
        onboardingWelcomeSeen: true,
        adsTotalWatched: 33,
        streak: { count: 12, lastLoginDate: "2099-01-01" },
      });
      return {
        changed,
        xp: state.playerXp,
        panier: state.upgrades.panier,
        cosmique: state.upgrades.cosmique,
        bananaLevel7: state.bananaLevels[7],
        permanent: state.permanentQuests.completed.slice().sort(),
        memoryBestMoves: state.memoryGame.bestMoves,
        welcomeSeen: state.onboarding.welcomeSeen,
        ads: state.ads.totalWatched,
        streakCount: state.streak.count,
        tabs: state.tabsUnlocked.slice().sort(),
      };
    });

    assert.strictEqual(richer.changed, true, "merging a richer remote state must report a change");
    assert.strictEqual(richer.xp, 99999, "a richer remote state must raise local XP");
    assert.strictEqual(richer.panier, 9, "a richer remote state must raise a shop upgrade");
    assert.strictEqual(richer.cosmique, 3, "an upgrade only known remotely must be brought in");
    assert.strictEqual(richer.bananaLevel7, 12, "a banana level only known remotely must be brought in");
    assert.deepStrictEqual(richer.permanent, ["pq_a", "pq_b", "pq_c"], "completed permanent quests must be unioned, never replaced");
    assert.strictEqual(richer.memoryBestMoves, 6, "a better remote Memory score (lower) must win");
    assert.strictEqual(richer.welcomeSeen, true, "having seen the tutorial elsewhere must carry over");
    assert.strictEqual(richer.ads, 33, "the lifetime ad counter must be brought in");
    assert.strictEqual(richer.streakCount, 12, "the login streak must be brought in");
    assert.deepStrictEqual(richer.tabs, ["bilan", "combat", "economie", "social"], "tabs must be unioned across devices");

    // --- Quêtes datées : période plus récente côté serveur ----------------
    const quests = await page.evaluate(() => {
      // Scénario indépendant du Prestige : on repart d'un niveau 0 pour que
      // la fusion ne soit pas court-circuitée par la garde anti-Prestige.
      state.prestige.level = 0;
      state.quests = { date: "2026-01-01", assigned: ["a1"], progress: { rolls: 5 }, completed: ["a1"] };
      mergeRemoteState({ v: 1, quests: { date: "2026-06-01", assigned: ["b1", "b2"], progress: { rolls: 2 }, completed: [] } });
      const newer = { ...state.quests };

      // Même période : on cumule au lieu de remplacer.
      state.quests = { date: "2026-06-01", assigned: ["b1", "b2"], progress: { rolls: 9 }, completed: ["b1"] };
      mergeRemoteState({ v: 1, quests: { date: "2026-06-01", assigned: ["b1", "b2"], progress: { rolls: 4, ads: 3 }, completed: ["b2"] } });
      return { newer, same: { progress: state.quests.progress, completed: state.quests.completed.slice().sort() } };
    });

    assert.strictEqual(quests.newer.date, "2026-06-01", "a newer remote quest period must be adopted");
    assert.deepStrictEqual(quests.newer.assigned, ["b1", "b2"], "adopting a newer period must take its assigned quests");
    assert.strictEqual(quests.same.progress.rolls, 9, "same period: quest progress must keep the higher value");
    assert.strictEqual(quests.same.progress.ads, 3, "same period: progress only known remotely must be brought in");
    assert.deepStrictEqual(quests.same.completed, ["b1", "b2"], "same period: completed quests must be unioned");

    // --- Passe saisonnier : une saison révolue ne revient jamais ----------
    const season = await page.evaluate(() => {
      state.prestige.level = 0;
      state.seasonPass = { points: 500, seasonKey: "2026-08", questProgress: { rolls: 10 }, questsCompleted: ["sq_a"], notifiedTiers: [1] };
      // Saison PLUS ANCIENNE côté serveur : ignorée.
      mergeRemoteState({ v: 1, seasonPass: { points: 99999, seasonKey: "2026-01", questProgress: {}, questsCompleted: [], notifiedTiers: [] } });
      const older = { points: state.seasonPass.points, key: state.seasonPass.seasonKey };
      // Même saison : cumul.
      mergeRemoteState({ v: 1, seasonPass: { points: 800, seasonKey: "2026-08", questProgress: { rolls: 3, pvp: 7 }, questsCompleted: ["sq_b"], notifiedTiers: [2] } });
      return {
        older,
        points: state.seasonPass.points,
        progress: state.seasonPass.questProgress,
        completed: state.seasonPass.questsCompleted.slice().sort(),
        notified: state.seasonPass.notifiedTiers.slice().sort(),
      };
    });

    assert.strictEqual(season.older.points, 500, "an OLDER remote season must never overwrite the current one");
    assert.strictEqual(season.older.key, "2026-08", "an older remote season must not change the current season key");
    assert.strictEqual(season.points, 800, "same season: the higher point total wins");
    assert.strictEqual(season.progress.rolls, 10, "same season: quest progress keeps the higher value");
    assert.strictEqual(season.progress.pvp, 7, "same season: progress only known remotely is brought in");
    assert.deepStrictEqual(season.completed, ["sq_a", "sq_b"], "same season: completed quests are unioned");
    assert.deepStrictEqual(season.notified, [1, 2], "same season: notified tiers are unioned (no re-notification)");

    // --- Le Prestige ne doit JAMAIS être annulé par la synchronisation ----
    // Régression réelle : la fusion par maximum/union ressuscitait les
    // améliorations de boutique, compteurs, quêtes et onglets qu'un Prestige
    // venait de remettre à zéro, en les reprenant au bloc serveur d'AVANT.
    const prestige = await page.evaluate(() => {
      // Une partie bien avancée, puis un Prestige.
      state.prestige.level = 0;
      state.playerXp = 12000;
      state.bananaLevels = { 3: 25 };
      state.upgrades.panier = 8;
      state.totalRolls = 3000;
      state.tabsUnlocked = ["economie", "combat", "social"];
      state.market.purchases = 50;
      // Le Prestige exige la collection normale complète (canPrestige()).
      state.discovered = NORMAL_BANANAS.map((b) => b.id);
      state.counts = { [NORMAL_BANANAS[0].id]: 4 };
      saveState();

      const blobAvantPrestige = collectSyncableState();
      doPrestige();
      const apresPrestige = {
        level: state.prestige.level,
        collection: state.discovered.length,
        panier: state.upgrades.panier,
        totalRolls: state.totalRolls,
        tabs: state.tabsUnlocked.length,
        xp: state.playerXp,
        bananaLevel3: state.bananaLevels[3],
      };

      // Le serveur porte encore le bloc d'AVANT le Prestige.
      mergeRemoteState(blobAvantPrestige);
      return {
        apresPrestige,
        apresFusion: {
          level: state.prestige.level,
          panier: state.upgrades.panier,
          totalRolls: state.totalRolls,
          tabs: state.tabsUnlocked.length,
          purchases: state.market.purchases,
          xp: state.playerXp,
          bananaLevel3: state.bananaLevels[3],
        },
      };
    });

    // Le Prestige lui-même (comportement existant du jeu).
    assert.strictEqual(prestige.apresPrestige.level, 1, "prestige must raise the prestige level");
    assert.strictEqual(prestige.apresPrestige.collection, 0, "prestige must wipe the collection");
    assert.strictEqual(prestige.apresPrestige.panier, 0, "prestige must reset shop upgrades");
    assert.strictEqual(prestige.apresPrestige.xp, 12000, "prestige must KEEP player XP (meta progression)");
    assert.strictEqual(prestige.apresPrestige.bananaLevel3, 25, "prestige must KEEP banana levels");

    // Et surtout : rapatrier l'ancien bloc serveur ne doit rien ressusciter.
    assert.strictEqual(prestige.apresFusion.panier, 0, "a pre-prestige remote state must NOT resurrect shop upgrades");
    assert.strictEqual(prestige.apresFusion.totalRolls, 0, "a pre-prestige remote state must NOT resurrect cumulative counters");
    assert.strictEqual(prestige.apresFusion.tabs, 0, "a pre-prestige remote state must NOT resurrect unlocked tabs");
    assert.strictEqual(prestige.apresFusion.purchases, 0, "a pre-prestige remote state must NOT resurrect market counters");
    assert.strictEqual(prestige.apresFusion.level, 1, "the prestige level must not go back down");
    assert.strictEqual(prestige.apresFusion.xp, 12000, "XP must survive (kept by prestige, merged by max)");
    assert.strictEqual(prestige.apresFusion.bananaLevel3, 25, "banana levels must survive (kept by prestige)");

    // --- Prestige fait sur un AUTRE appareil : la manche locale est révolue
    const remotePrestige = await page.evaluate(() => {
      state.prestige.level = 1;
      state.upgrades.panier = 6;
      state.totalRolls = 900;
      state.tabsUnlocked = ["economie", "combat"];
      state.playerXp = 500;
      saveState();

      mergeRemoteState({
        v: 1,
        prestigeLevel: 3,
        playerXp: 20000,
        nums: { totalRolls: 12 },
        upgrades: { panier: 1 },
        tabsUnlocked: ["economie"],
      });
      return {
        level: state.prestige.level,
        panier: state.upgrades.panier,
        totalRolls: state.totalRolls,
        tabs: state.tabsUnlocked.slice().sort(),
        xp: state.playerXp,
      };
    });

    assert.strictEqual(remotePrestige.level, 3, "a higher remote prestige level must be adopted");
    assert.strictEqual(remotePrestige.panier, 1, "a stale local run must not keep its higher upgrades past a newer prestige");
    assert.strictEqual(remotePrestige.totalRolls, 12, "a stale local run must not keep its higher counters past a newer prestige");
    assert.deepStrictEqual(remotePrestige.tabs, ["economie"], "a stale local run must not keep tabs unlocked in a previous run");
    assert.strictEqual(remotePrestige.xp, 20000, "XP is meta progression and must still be merged by max");

    // --- Robustesse : un état serveur absent/invalide ne casse rien -------
    const robust = await page.evaluate(() => {
      const xpBefore = state.playerXp;
      const a = mergeRemoteState(null);
      const b = mergeRemoteState(undefined);
      const c = mergeRemoteState({});
      return { a, b, c, xpUnchanged: state.playerXp === xpBefore };
    });
    assert.strictEqual(robust.a, false, "a null remote state must be a no-op");
    assert.strictEqual(robust.b, false, "an undefined remote state must be a no-op");
    assert.strictEqual(robust.xpUnchanged, true, "an empty/invalid remote state must never alter progression");

    // --- Ce qui a déjà sa propre synchro n'est jamais dans ce bloc --------
    const payload = await page.evaluate(() => Object.keys(collectSyncableState()));
    for (const forbidden of ["coins", "counts", "discovered", "pve", "achievements", "medals", "cosmetics", "profile", "cloud"]) {
      assert.ok(!payload.includes(forbidden), `"${forbidden}" has its own dedicated sync and must not be duplicated in the game-state blob`);
    }

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — game-state-sync.test.js"))
    .catch((e) => {
      console.error("FAILED — game-state-sync.test.js:", e.message);
      process.exit(1);
    });
}
