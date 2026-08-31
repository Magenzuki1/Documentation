// Vérifie qu'un franchissement de palier du Passe saisonnier est signalé
// tout de suite (un toast, comme pour une quête/un succès) dès que les
// points suffisent, sans que le joueur ait besoin de rouvrir la modale —
// et une seule fois par palier et par saison (pas de spam si les points
// continuent de monter au-delà du seuil). Déclenché via un vrai clic sur le
// bouton de récolte (showQuestToasts vit dans la fermeture de ui.js, pas
// question de l'appeler directement) : le total est positionné juste sous
// le seuil, et le tirage réel (+2 points) le fait franchir.
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");
const { skipOnboardingUi } = require("./lib/skip-onboarding");

async function collectBannerTitles(page, waitMs) {
  await page.waitForTimeout(waitMs);
  return page.$$eval(".rare-banner-title", (els) => els.map((e) => e.textContent));
}

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    // La prime de connexion quotidienne affiche son propre banner "JOUR 1 !"
    // via un setTimeout(500ms) au démarrage, sans rapport avec ce test.
    await page.waitForTimeout(700);
    await skipOnboardingUi(page);

    await page.evaluate(() => {
      CLOUD.available = true;
      CLOUD.isLinked = () => true;
      CLOUD.pushSeasonPoints = async () => {};
      // Cache local des paliers, comme rempli par CLOUD.init() au démarrage
      // normal — un seul palier à seuil bas suffit pour ce test.
      setSeasonPassTiersCache([{ tier: 1, threshold: 100 }]);
      // Mode rapide (pas de roulette de rareté animée) et rareté toujours
      // "commune" (Math.random figé à 0) : sans ça, un tirage rare/légendaire
      // obtenu par pur hasard peut compléter une Quête de saison en même
      // temps que le palier, et l'animation ajoute un délai variable avant
      // que checkQuests() ne tourne — deux sources de flakiness pour un test
      // qui ne s'intéresse qu'au franchissement de palier lui-même.
      state.settings.animatedRoll = false;
      Math.random = () => 0;
      // Un succès, une quête du jour/de la semaine assignée pour aujourd'hui,
      // ou une autre Quête de saison peuvent se compléter sur ces mêmes
      // tirages sans rapport avec le palier testé — chacun prendrait la
      // place du bandeau de palier dans la file d'attente des notifications
      // (un seul bandeau visible à la fois, voir showBanner() dans ui.js).
      // Tout est neutralisé d'un coup pour isoler la seule chose que ce
      // test vérifie, plutôt que de traquer au cas par cas quel identifiant
      // précis correspond au jour où le test tourne.
      state.achievements.unlocked = ACHIEVEMENTS.map((a) => a.id);
      state.quests.assigned = [];
      state.weeklyQuests.assigned = [];
      state.permanentQuests.completed = PERMANENT_QUEST_POOL.map((q) => q.id);
      state.seasonPass = {
        points: 90,
        seasonKey: currentSeasonKey(),
        questProgress: {},
        questsCompleted: SEASON_QUEST_POOL.map((q) => q.id),
        notifiedTiers: [],
      };
      document.querySelectorAll(".rare-banner").forEach((b) => b.remove());
    });

    // Un tirage sous le seuil (+2 -> 92) : pas de notification de palier.
    await page.click("#harvest-btn");
    let titles = await collectBannerTitles(page, 1500);
    assert.ok(!titles.some((t) => t.includes("PALIER DÉBLOQUÉ")), `no tier notification expected below threshold, got: ${titles}`);
    await page.evaluate(() => document.querySelectorAll(".rare-banner").forEach((b) => b.remove()));

    // Repositionne juste sous le seuil et tire à nouveau : ce tirage (+2)
    // franchit 100 -> le toast doit apparaître.
    await page.evaluate(() => { state.seasonPass.points = 99; });
    await page.click("#harvest-btn");
    titles = await collectBannerTitles(page, 1500);
    assert.ok(titles.some((t) => t.includes("PALIER DÉBLOQUÉ")), `expected a tier-unlock toast after crossing the threshold, got: ${titles}`);
    assert.deepStrictEqual(
      await page.evaluate(() => state.seasonPass.notifiedTiers),
      [1],
      "tier 1 must be recorded as notified"
    );
    await page.evaluate(() => document.querySelectorAll(".rare-banner").forEach((b) => b.remove()));

    // Un tirage de plus, points toujours au-dessus du seuil : pas de second
    // toast pour le même palier déjà notifié cette saison.
    await page.click("#harvest-btn");
    titles = await collectBannerTitles(page, 1500);
    assert.ok(!titles.some((t) => t.includes("PALIER DÉBLOQUÉ")), `must not re-notify the same tier, got: ${titles}`);

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — season-tier-notification.test.js"))
    .catch((e) => {
      console.error("FAILED — season-tier-notification.test.js:", e.message);
      process.exit(1);
    });
}
