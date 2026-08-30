// Régression CRITIQUE signalée par un joueur : un correctif précédent avait
// fait de CLOUD.signOut() un reset complet de l'état local (resetSave()),
// pour éviter qu'une session invité suivante n'hérite de l'affichage du
// compte qui venait de se déconnecter. Mais l'Arène solo, l'XP, les succès,
// les quêtes et les améliorations de la boutique ne sont PAS sauvegardés sur
// le cloud (seuls le solde, les bananes, les médailles et les cosmétiques le
// sont) — ce reset détruisait donc définitivement une vraie progression de
// jeu, sans aucun moyen de la récupérer à la reconnexion. Corrigé en
// revenant à une déconnexion qui ne touche QUE la session cloud/le lien
// local, sans jamais toucher à l'état de jeu. Voir aussi pullPve() dans
// cloud.js, qui restaure la progression Arène solo depuis le serveur si elle
// y est plus avancée qu'en local (utile après un changement d'appareil).
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
    await page.waitForTimeout(300);
    await skipOnboardingUi(page);

    // Simule une vraie session de jeu bien avancée (comme un joueur qui a
    // beaucoup joué avant de se déconnecter).
    await page.evaluate(() => {
      state.coins = 123456;
      state.totalRolls = 50;
      state.tabsUnlocked = ["economie", "combat", "social"];
      state.onboarding.welcomeSeen = true;
      state.cosmetics.unlocked = ["title_ami_fruits", "title_insomniaque"];
      state.cosmetics.equippedTitle = "title_ami_fruits";
      state.pve = { stage: 42, wins: 30, losses: 5 };
      state.playerXp = 9000;
      state.cloud.linked = true;
      saveState();
    });

    // CLOUD.signOut() appelle en interne supabase.auth.signOut() — absent
    // dans cet environnement de test (pas de CDN Supabase), donc `supabase`
    // vaut null et cette étape est ignorée sans erreur ; le reste de la
    // fonction (déliaison locale) s'exécute normalement, sans réseau.
    await page.evaluate(() => CLOUD.signOut());
    await page.waitForTimeout(200);

    const after = await page.evaluate(() => ({
      coins: state.coins,
      totalRolls: state.totalRolls,
      tabsUnlocked: state.tabsUnlocked,
      welcomeSeen: state.onboarding.welcomeSeen,
      cosmeticsUnlocked: state.cosmetics.unlocked,
      equippedTitle: state.cosmetics.equippedTitle,
      pve: state.pve,
      playerXp: state.playerXp,
      cloudLinked: state.cloud.linked,
    }));

    // Seul le lien cloud doit changer — tout le reste de la progression de
    // jeu (y compris ce qui n'est jamais sauvegardé côté serveur) doit
    // survivre intact à une déconnexion.
    assert.strictEqual(after.coins, 123456, "coins must NOT be reset on sign-out");
    assert.strictEqual(after.totalRolls, 50, "totalRolls must NOT be reset on sign-out");
    assert.deepStrictEqual(after.tabsUnlocked, ["economie", "combat", "social"], "unlocked tabs must NOT be reset on sign-out");
    assert.strictEqual(after.welcomeSeen, true, "the welcome flag must NOT be reset on sign-out");
    assert.deepStrictEqual(after.cosmeticsUnlocked, ["title_ami_fruits", "title_insomniaque"], "owned cosmetics must NOT be reset on sign-out");
    assert.strictEqual(after.equippedTitle, "title_ami_fruits", "the equipped title must NOT be reset on sign-out");
    assert.deepStrictEqual(after.pve, { stage: 42, wins: 30, losses: 5 }, "PvE progress (never cloud-synced back down before this fix) must NOT be reset on sign-out");
    assert.strictEqual(after.playerXp, 9000, "player XP must NOT be reset on sign-out");
    assert.strictEqual(after.cloudLinked, false, "only the cloud link itself must be cleared by sign-out");

    // Pas de rechargement de page : le message de bienvenue (déjà vu) ne
    // doit pas réapparaître après une simple déconnexion.
    const welcomeVisible = await page.$eval("#welcome-modal", (el) => !el.classList.contains("hidden"));
    assert.strictEqual(welcomeVisible, false, "signing out must not trigger the first-launch welcome modal");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — sign-out-preserves-progress.test.js"))
    .catch((e) => {
      console.error("FAILED — sign-out-preserves-progress.test.js:", e.message);
      process.exit(1);
    });
}
