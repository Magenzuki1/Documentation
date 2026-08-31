// Toutes les notifications de récompense (succès, quêtes, médailles, palier
// de saison, bonus quotidien, roue de la fortune...) partagent le même
// bandeau `.rare-banner`, posé en `position: fixed` au même endroit à
// l'écran. Rien n'empêchait deux d'entre elles de s'afficher en même temps
// quand deux événements indépendants se déclenchent au même instant (ex. un
// tirage qui complète à la fois un succès ET une quête) : la seconde
// recouvrait totalement la première, qui restait techniquement "affichée"
// mais invisible pour le joueur — repéré en jouant manuellement (bonus de
// la roue quotidienne masqué par une quête de saison qui se terminait au
// même moment). showBanner() passe désormais par une file : un seul bandeau
// visible à la fois, dans l'ordre d'arrivée.
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
    await skipOnboardingUi(page);
    // Laisse la prime de connexion quotidienne ("JOUR 1 !", son propre
    // bandeau tiré au démarrage) terminer naturellement son cycle plutôt que
    // de la retirer de force : un retrait manuel du DOM ne libère pas le
    // verrou interne de la file, qui attend son minuteur d'origine.
    await page.waitForTimeout(2700);

    await page.evaluate(() => {
      // Mode rapide et rareté toujours "commune" : un seul tirage, sans
      // animation ni effet de rareté qui ajouterait des bandeaux imprévus.
      state.settings.animatedRoll = false;
      Math.random = () => 0;
      // Neutralise tout ce qui pourrait se compléter incidemment ce
      // tirage-là (quête du jour/de la semaine assignée pour aujourd'hui,
      // autre Quête de saison...) : seuls les deux événements voulus doivent
      // apparaître, ni plus ni moins, quel que soit le jour où le test tourne.
      state.achievements.unlocked = ACHIEVEMENTS.map((a) => a.id).filter((id) => id !== "first_harvest");
      state.quests.assigned = [];
      state.weeklyQuests.assigned = [];
      state.permanentQuests.completed = PERMANENT_QUEST_POOL.map((q) => q.id).filter((id) => id !== "p_rolls1000");
      state.seasonPass.questsCompleted = SEASON_QUEST_POOL.map((q) => q.id);
      // Un seul tirage doit déclencher à la fois le succès "Première
      // récolte" (totalRolls >= 1, exclu ci-dessus) ET la quête permanente
      // "Récolte 1000 bananes" (need 1000, exclue ci-dessus) : totalRolls
      // passe de 999 à 1000 sur ce tirage précis.
      state.totalRolls = 999;
      saveState();
    });

    await page.click("#harvest-btn");

    // Sonde toutes les 60ms pendant 5s : jamais plus d'un bandeau affiché à
    // la fois, et les deux doivent finir par apparaître, dans l'ordre où
    // ils sont déclenchés côté code (succès avant quête).
    let maxConcurrentlyShown = 0;
    const seenOrder = [];
    for (let elapsed = 0; elapsed < 5000; elapsed += 60) {
      await page.waitForTimeout(60);
      const titles = await page.$$eval(".rare-banner.show .rare-banner-title", (els) => els.map((e) => e.textContent));
      maxConcurrentlyShown = Math.max(maxConcurrentlyShown, titles.length);
      titles.forEach((t) => { if (!seenOrder.includes(t)) seenOrder.push(t); });
    }

    assert.strictEqual(maxConcurrentlyShown, 1, `au plus un bandeau visible à la fois, jamais ${maxConcurrentlyShown}`);
    assert.deepStrictEqual(
      seenOrder,
      ["🏆 SUCCÈS DÉBLOQUÉ !", "📜 QUÊTE TERMINÉE !"],
      `les deux bandeaux doivent apparaître l'un après l'autre, dans cet ordre — vu : ${JSON.stringify(seenOrder)}`
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
    .then(() => console.log("OK — reward-banner-queue.test.js"))
    .catch((e) => {
      console.error("FAILED — reward-banner-queue.test.js:", e.message);
      process.exit(1);
    });
}
