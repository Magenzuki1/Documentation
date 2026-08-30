// Historique : CLOUD.signOut() a d'abord tout remis à zéro (resetSave()),
// pour éviter qu'une session invité n'hérite de l'affichage du compte
// déconnecté — mais ça détruisait définitivement l'Arène solo, l'XP, les
// quêtes et les onglets débloqués, jamais sauvegardés sur le cloud. Corrigé
// une première fois en ne touchant plus du tout à l'état (voir l'historique
// git), mais cela laissait alors la progression du compte affichée après
// déconnexion — le tout premier problème signalé revenait.
//
// Solution retenue : un instantané de la progression INVITÉE (avant tout
// compte lié sur cet appareil) est mis de côté à la connexion
// (snapshotGuestStateIfGuest(), dans signIn()/signUp()) et restitué à la
// déconnexion (restoreGuestStateSnapshot()) — jamais un remplacement par du
// vide, jamais un maintien de la progression du compte parti. Ce fichier
// couvre les deux scénarios : un appareil qui avait déjà joué en invité
// avant de lier un compte, et un appareil qui n'a jamais eu de session
// invité (compte créé dès le premier lancement).
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");
const { skipOnboardingUi } = require("./lib/skip-onboarding");

async function signOutAndWaitForReload(page) {
  await Promise.all([
    page.waitForEvent("load", { timeout: 15000 }),
    page.evaluate(() => { CLOUD.signOut(); }),
  ]);
  await page.waitForTimeout(200);
}

async function runGuestSnapshotScenario() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await skipOnboardingUi(page);

    // Une petite progression invité, avant de lier un compte. Les succès que
    // ces stats satisfont déjà (ex. "Première récolte" pour totalRolls >= 1)
    // sont marqués comme déjà débloqués : sinon checkAchievements(), qui
    // tourne à chaque chargement de page, les déclencherait pour de vrai
    // après le rechargement suivant et ajouterait leur récompense en pièces,
    // faussant l'assertion sur le solde restauré.
    await page.evaluate(() => {
      state.coins = 77;
      state.totalRolls = 2;
      state.pve = { stage: 1, wins: 1, losses: 0 };
      state.onboarding.welcomeSeen = true;
      state.achievements.unlocked = ACHIEVEMENTS.filter((a) => {
        try { return a.check(state); } catch (e) { return false; }
      }).map((a) => a.id);
      saveState();
      // Simule ce que fait signIn()/signUp() juste avant de rapatrier les
      // données d'un compte (pas de vrai réseau ici) : met de côté cette
      // progression invité pendant qu'elle est encore la seule présente.
      snapshotGuestStateIfGuest();
      // Simule le rapatriement des données du compte qui vient de se lier :
      // une progression bien plus riche, sans rapport avec l'invité.
      state.coins = 123456;
      state.totalRolls = 50;
      state.tabsUnlocked = ["economie", "combat", "social"];
      state.pve = { stage: 42, wins: 30, losses: 5 };
      state.cloud.linked = true;
      saveState();
    });

    await signOutAndWaitForReload(page);

    const after = await page.evaluate(() => ({
      coins: state.coins,
      totalRolls: state.totalRolls,
      pve: state.pve,
      cloudLinked: state.cloud.linked,
    }));

    assert.strictEqual(after.coins, 77, "sign-out must restore the guest snapshot's coins, not keep the account's");
    assert.strictEqual(after.totalRolls, 2, "sign-out must restore the guest snapshot's totalRolls");
    assert.strictEqual(after.pve.stage, 1, "sign-out must restore the guest snapshot's PvE stage");
    assert.strictEqual(after.pve.wins, 1, "sign-out must restore the guest snapshot's PvE wins");
    assert.strictEqual(after.pve.losses, 0, "sign-out must restore the guest snapshot's PvE losses");
    assert.strictEqual(after.cloudLinked, false, "sign-out must clear the cloud link");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

async function runNoPriorGuestScenario() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    await skipOnboardingUi(page);

    // Un appareil qui n'a JAMAIS eu de session invité (compte créé/lié dès le
    // premier lancement, sans jamais appeler snapshotGuestStateIfGuest()) :
    // aucun instantané à restituer, la déconnexion doit retomber sur un état
    // neuf plutôt que de laisser la progression du compte affichée.
    await page.evaluate(() => {
      state.coins = 123456;
      state.totalRolls = 50;
      state.tabsUnlocked = ["economie", "combat", "social"];
      state.onboarding.welcomeSeen = true;
      state.cloud.linked = true;
      saveState();
    });

    await signOutAndWaitForReload(page);

    const after = await page.evaluate(() => ({
      coins: state.coins,
      totalRolls: state.totalRolls,
      tabsUnlocked: state.tabsUnlocked,
      welcomeSeen: state.onboarding.welcomeSeen,
      cloudLinked: state.cloud.linked,
    }));

    assert.ok(after.coins < 100, `with no prior guest snapshot, sign-out must fall back to a fresh state, got coins=${after.coins}`);
    assert.strictEqual(after.totalRolls, 0, "with no prior guest snapshot, totalRolls must reset");
    assert.deepStrictEqual(after.tabsUnlocked, [], "with no prior guest snapshot, no tab should stay unlocked");
    assert.strictEqual(after.welcomeSeen, false, "with no prior guest snapshot, the welcome flag must reset");
    assert.strictEqual(after.cloudLinked, false, "sign-out must clear the cloud link");

    const welcomeVisible = await page.$eval("#welcome-modal", (el) => !el.classList.contains("hidden"));
    assert.ok(welcomeVisible, "with no prior guest snapshot, the welcome modal must show again like a brand new visitor");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

async function run() {
  await runGuestSnapshotScenario();
  await runNoPriorGuestScenario();
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — sign-out-restores-guest-state.test.js"))
    .catch((e) => {
      console.error("FAILED — sign-out-restores-guest-state.test.js:", e.message);
      process.exit(1);
    });
}
