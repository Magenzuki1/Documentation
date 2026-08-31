// Vérifie le parcours d'un nouveau joueur : (1) un message de bienvenue
// s'affiche une seule fois au tout premier lancement, et (2) les onglets
// Économie/Combat/Social restent masqués tant que TAB_UNLOCK_RULES (app.js)
// n'est pas satisfaite, se révèlent au fil des premiers tirages (via
// checkTabUnlocks(), greffé dans checkQuests()) avec un toast, et restent
// révélés une fois débloqués (jamais re-masqués).
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");

async function collectBannerTitles(page, waitMs) {
  await page.waitForTimeout(waitMs);
  return page.$$eval(".rare-banner-title", (els) => els.map((e) => e.textContent));
}

async function isTabHidden(page, tabId) {
  return page.$eval(`.tab-btn[data-tab="${tabId}"]`, (el) => el.classList.contains("hidden"));
}

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);

    // 1) Message de bienvenue affiché au tout premier lancement.
    const welcomeVisibleAtStart = await page.$eval("#welcome-modal", (el) => !el.classList.contains("hidden"));
    assert.ok(welcomeVisibleAtStart, "the welcome modal must show on a brand new save");

    // Les onglets riches sont masqués dès le départ (totalRolls = 0).
    assert.ok(await isTabHidden(page, "economie"), "economie tab must start hidden");
    assert.ok(await isTabHidden(page, "combat"), "combat tab must start hidden");
    assert.ok(await isTabHidden(page, "social"), "social tab must start hidden");
    // Le cœur du jeu reste toujours visible.
    assert.strictEqual(await isTabHidden(page, "accueil"), false, "accueil tab must never be hidden");
    assert.strictEqual(await isTabHidden(page, "progression"), false, "progression tab must never be hidden");
    assert.strictEqual(await isTabHidden(page, "bilan"), false, "bilan tab must never be hidden");

    // Fermer via le CTA marque welcomeSeen et ne doit plus jamais réapparaître.
    await page.click("#welcome-modal-close");
    await page.waitForTimeout(100);
    const welcomeHiddenAfterClose = await page.$eval("#welcome-modal", (el) => el.classList.contains("hidden"));
    assert.ok(welcomeHiddenAfterClose, "closing the welcome modal must hide it");
    assert.strictEqual(await page.evaluate(() => state.onboarding.welcomeSeen), true, "welcomeSeen must be persisted");

    // Un rechargement de page (même save) ne doit pas la réafficher.
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    const welcomeVisibleAfterReload = await page.$eval("#welcome-modal", (el) => !el.classList.contains("hidden"));
    assert.strictEqual(welcomeVisibleAfterReload, false, "the welcome modal must not reappear once seen");

    // Ce rechargement relance aussi le bandeau de la prime de connexion
    // quotidienne ("JOUR 1 !", son propre setTimeout(500ms) au démarrage) :
    // le laisser terminer son cycle avant la section suivante, sinon il
    // occupe la file d'attente des notifications (un seul bandeau visible à
    // la fois, voir showBanner() dans ui.js) au moment même où on vérifie le
    // toast de déverrouillage d'onglet.
    await page.waitForTimeout(2700);

    // 2) Déverrouillage progressif des onglets au fil des tirages, avec
    // toast — tirages forcés déterministes (rareté "commune", pas d'anim)
    // pour éviter qu'une quête de saison ou un succès parasite le compte de
    // banners attendu.
    await page.evaluate(() => {
      state.settings.animatedRoll = false;
      Math.random = () => 0;
      // Un succès ("Première récolte"), une quête du jour/de la semaine
      // assignée pour aujourd'hui, ou une Quête de saison (au moins
      // "Connecte-toi 1 jour ce mois-ci", satisfaite dès la première
      // session) peuvent se compléter sur ces mêmes tirages sans rapport
      // avec le déverrouillage d'onglet testé — chacun prendrait la place
      // du bandeau attendu dans la file d'attente des notifications (un
      // seul bandeau visible à la fois, voir showBanner() dans ui.js). Tout
      // est neutralisé d'un coup plutôt que de traquer au cas par cas quel
      // identifiant précis correspond au jour où le test tourne.
      state.achievements.unlocked = ACHIEVEMENTS.map((a) => a.id);
      state.quests.assigned = [];
      state.weeklyQuests.assigned = [];
      state.permanentQuests.completed = PERMANENT_QUEST_POOL.map((q) => q.id);
      state.seasonPass.questsCompleted = SEASON_QUEST_POOL.map((q) => q.id);
      document.querySelectorAll(".rare-banner").forEach((b) => b.remove());
    });

    await page.click("#harvest-btn"); // totalRolls: 1
    await page.click("#harvest-btn"); // totalRolls: 2
    let titles = await collectBannerTitles(page, 200);
    assert.ok(!titles.some((t) => t.includes("NOUVEL ONGLET")), `no tab should unlock before totalRolls >= 3, got: ${titles}`);
    assert.ok(await isTabHidden(page, "economie"), "economie must stay hidden below its threshold");

    await page.evaluate(() => document.querySelectorAll(".rare-banner").forEach((b) => b.remove()));
    await page.click("#harvest-btn"); // totalRolls: 3 -> economie unlocks
    titles = await collectBannerTitles(page, 1200);
    assert.ok(titles.some((t) => t.includes("NOUVEL ONGLET")), `expected a tab-unlock toast at totalRolls=3, got: ${titles}`);
    assert.strictEqual(await isTabHidden(page, "economie"), false, "economie tab must be revealed at totalRolls=3");
    assert.ok(await isTabHidden(page, "combat"), "combat must still be hidden at totalRolls=3");

    await page.evaluate(() => document.querySelectorAll(".rare-banner").forEach((b) => b.remove()));
    await page.click("#harvest-btn"); // totalRolls: 4
    await page.click("#harvest-btn"); // totalRolls: 5 -> combat unlocks
    await page.waitForTimeout(1200);
    assert.strictEqual(await isTabHidden(page, "combat"), false, "combat tab must be revealed at totalRolls=5");
    assert.deepStrictEqual(
      await page.evaluate(() => state.tabsUnlocked.slice().sort()),
      ["combat", "economie"],
      "tabsUnlocked must persist every tab unlocked so far"
    );

    // Reste caché même en cliquant directement sur le bouton d'un onglet
    // pas encore débloqué (aucune protection JS nécessaire côté clic : le
    // bouton est simplement invisible, ceci vérifie juste qu'il n'apparaît
    // pas tant que le seuil n'est pas atteint).
    assert.ok(await isTabHidden(page, "social"), "social must still be hidden below its own threshold");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — onboarding.test.js"))
    .catch((e) => {
      console.error("FAILED — onboarding.test.js:", e.message);
      process.exit(1);
    });
}
