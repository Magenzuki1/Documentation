// Régression signalée par un joueur : après déconnexion, le jeu affichait
// encore toute la progression du compte qui venait de se déconnecter (pièces,
// onglets débloqués, cosmétiques...) au lieu de repartir de zéro — CLOUD.signOut()
// ne faisait que couper la session Supabase et le lien local (cloud.linked),
// sans jamais réinitialiser l'état de jeu lui-même. Vérifie que signOut()
// remet bien tout à l'état d'un tout premier lancement (comme resetSave(),
// qu'il réutilise désormais) puis recharge la page.
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

    // Simule un compte connecté avec beaucoup de progression déjà tirée du
    // cloud (comme après une vraie session de jeu), pour vérifier qu'aucune
    // trace n'en survit après déconnexion.
    await page.evaluate(() => {
      state.coins = 123456;
      state.totalRolls = 50;
      state.tabsUnlocked = ["economie", "combat", "social"];
      state.onboarding.welcomeSeen = true;
      state.cosmetics.unlocked = ["title_ami_fruits", "title_insomniaque"];
      state.cosmetics.equippedTitle = "title_ami_fruits";
      state.cloud.linked = true;
      saveState();
    });

    // CLOUD.signOut() appelle en interne supabase.auth.signOut() (réel, mais
    // borné à 3s même si le réseau traîne — voir son commentaire) puis
    // location.reload() — on ne l'attend pas depuis l'évaluation (le contexte
    // de page serait de toute façon détruit par le rechargement), on attend
    // plutôt l'événement "load" de la page qui suit.
    await Promise.all([
      page.waitForEvent("load", { timeout: 15000 }),
      page.evaluate(() => { CLOUD.signOut(); }),
    ]);
    await page.waitForTimeout(300);

    const after = await page.evaluate(() => ({
      coins: state.coins,
      totalRolls: state.totalRolls,
      tabsUnlocked: state.tabsUnlocked,
      welcomeSeen: state.onboarding.welcomeSeen,
      cosmeticsUnlocked: state.cosmetics.unlocked,
      equippedTitle: state.cosmetics.equippedTitle,
      cloudLinked: state.cloud.linked,
    }));

    // Un tout premier lancement gagne toujours la petite prime de connexion
    // du jour 1 (voir processDailyStreak()) : on vérifie juste que l'énorme
    // solde simulé du compte a disparu, pas une égalité exacte à un montant
    // qui pourrait légitimement changer avec l'équilibrage.
    assert.ok(after.coins < 100, `coins must reset away from the simulated account balance, got ${after.coins}`);
    assert.strictEqual(after.totalRolls, 0, "totalRolls must reset to 0");
    assert.deepStrictEqual(after.tabsUnlocked, [], "no tab should stay unlocked after signing out");
    assert.strictEqual(after.welcomeSeen, false, "the welcome flag must reset so a new guest session sees it again");
    assert.deepStrictEqual(after.cosmeticsUnlocked, [], "owned cosmetics from the account must not leak into the guest session");
    assert.strictEqual(after.equippedTitle, null, "no title should stay equipped after signing out");
    assert.strictEqual(after.cloudLinked, false, "the guest session must not still be flagged as cloud-linked");

    // La page rechargée doit se comporter comme un tout premier lancement :
    // le message de bienvenue réapparaît.
    const welcomeVisible = await page.$eval("#welcome-modal", (el) => !el.classList.contains("hidden"));
    assert.ok(welcomeVisible, "the welcome modal must show again after signing out, like a brand new visitor");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — sign-out-reset.test.js"))
    .catch((e) => {
      console.error("FAILED — sign-out-reset.test.js:", e.message);
      process.exit(1);
    });
}
