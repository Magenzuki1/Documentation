// Le jeu n'avait qu'UNE seule sauvegarde locale partagée par l'invité et par
// tous les comptes. Se connecter ne changeait donc pas de partie : la
// progression invité restait affichée puis était poussée dans le compte —
// invité et compte devenaient littéralement la même partie. D'où les
// symptômes signalés en boucle par un joueur, que ce fichier verrouille :
//
//   1. créer un compte depuis une partie invité déjà avancée doit démarrer
//      une partie NEUVE (tutoriel compris), pas absorber celle de l'invité ;
//   2. se déconnecter doit rendre à l'invité SA partie, pas celle du compte
//      qui vient d'être créé ;
//   3. se reconnecter au compte doit retrouver la partie du compte, y compris
//      ce qui n'est PAS synchronisé sur le serveur (XP, quêtes, boutique) ;
//   4. une sauvegarde antérieure à ce mécanisme (joueur déjà connecté au
//      moment de la mise à jour) doit être adoptée telle quelle, jamais
//      remplacée par une partie neuve.
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");

// Simule signIn()/signUp() sans réseau : c'est exactement ce que fait
// cloud.js (bascule d'identité puis marquage du lien), la partie réseau
// (pull*/push*) n'ayant rien à voir avec la séparation des sauvegardes.
const FAKE_SIGN_IN = (username) => {
  switchToIdentity(accountIdentity(username));
  state.cloud.linked = true;
  saveState();
};

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);

    // --- Une partie invité déjà bien avancée -------------------------------
    const guestState = await page.evaluate(() => {
      state.coins = 5000;
      state.totalRolls = 40;
      state.playerXp = 900;
      state.upgrades.panier = 3;
      state.onboarding.welcomeSeen = true;
      state.discovered = [NORMAL_BANANAS[0].id, NORMAL_BANANAS[1].id, NORMAL_BANANAS[2].id];
      saveState();
      return { coins: state.coins, xp: state.playerXp, panier: state.upgrades.panier };
    });
    assert.strictEqual(guestState.coins, 5000, "sanity: guest state was set up");

    // --- (1) Création d'un compte : partie NEUVE, pas celle de l'invité ----
    const afterSignUp = await page.evaluate((fn) => {
      new Function("username", `return (${fn})(username)`)("nouveau");
      return {
        coins: state.coins,
        totalRolls: state.totalRolls,
        xp: state.playerXp,
        panier: state.upgrades.panier,
        welcomeSeen: state.onboarding.welcomeSeen,
        discovered: state.discovered.length,
        linked: state.cloud.linked,
      };
    }, FAKE_SIGN_IN.toString());

    assert.strictEqual(afterSignUp.coins, 0, `a brand new account must NOT inherit the guest's coins, got ${afterSignUp.coins}`);
    assert.strictEqual(afterSignUp.totalRolls, 0, "a brand new account must not inherit the guest's rolls");
    assert.strictEqual(afterSignUp.xp, 0, "a brand new account must not inherit the guest's XP");
    assert.strictEqual(afterSignUp.panier, 0, "a brand new account must not inherit the guest's shop upgrades");
    assert.strictEqual(afterSignUp.discovered, 0, "a brand new account must not inherit the guest's collection");
    assert.strictEqual(afterSignUp.welcomeSeen, false, "a brand new account must see the tutorial again (welcomeSeen reset)");
    assert.strictEqual(afterSignUp.linked, true, "the account must be flagged as linked");

    // Le compte joue un peu, avec de la progression NON synchronisée (XP,
    // boutique) — c'est précisément ce que les correctifs précédents
    // détruisaient.
    await page.evaluate(() => {
      state.coins = 777;
      state.playerXp = 250;
      state.upgrades.panier = 1;
      state.onboarding.welcomeSeen = true;
      saveState();
    });

    // --- (2) Déconnexion : l'invité retrouve SA partie --------------------
    const afterSignOut = await page.evaluate(() => {
      switchToIdentity(GUEST_IDENTITY);
      state.cloud.linked = false;
      saveState();
      return {
        coins: state.coins,
        totalRolls: state.totalRolls,
        xp: state.playerXp,
        panier: state.upgrades.panier,
        discovered: state.discovered.length,
        linked: state.cloud.linked,
      };
    });

    assert.strictEqual(afterSignOut.coins, 5000, `signing out must restore the guest's own save, got ${afterSignOut.coins} coins`);
    assert.strictEqual(afterSignOut.totalRolls, 40, "signing out must restore the guest's rolls");
    assert.strictEqual(afterSignOut.xp, 900, "signing out must restore the guest's XP");
    assert.strictEqual(afterSignOut.panier, 3, "signing out must restore the guest's shop upgrades");
    assert.strictEqual(afterSignOut.discovered, 3, "signing out must restore the guest's collection");
    assert.strictEqual(afterSignOut.linked, false, "signing out must clear the cloud link");

    // --- (3) Reconnexion : la partie du compte est retrouvée intacte ------
    const afterSignBackIn = await page.evaluate((fn) => {
      new Function("username", `return (${fn})(username)`)("nouveau");
      return { coins: state.coins, xp: state.playerXp, panier: state.upgrades.panier };
    }, FAKE_SIGN_IN.toString());

    assert.strictEqual(afterSignBackIn.coins, 777, `signing back in must restore the account's own save, got ${afterSignBackIn.coins}`);
    assert.strictEqual(afterSignBackIn.xp, 250, "signing back in must restore the account's XP (never synced to the server)");
    assert.strictEqual(afterSignBackIn.panier, 1, "signing back in must restore the account's shop upgrades");

    // --- Deux comptes différents ne partagent rien -------------------------
    const secondAccount = await page.evaluate((fn) => {
      new Function("username", `return (${fn})(username)`)("autre");
      return { coins: state.coins, xp: state.playerXp };
    }, FAKE_SIGN_IN.toString());
    assert.strictEqual(secondAccount.coins, 0, "a different account must start from its own fresh save");
    assert.strictEqual(secondAccount.xp, 0, "a different account must not inherit another account's XP");

    // --- (4) Migration d'une sauvegarde antérieure au mécanisme -----------
    // Un joueur déjà connecté au moment de la mise à jour n'a aucune
    // identité active enregistrée : sa sauvegarde unique doit être adoptée
    // telle quelle pour SON compte, jamais remplacée par une partie neuve.
    const migrated = await page.evaluate(() => {
      localStorage.removeItem("banana-collector-active-identity-v1");
      Object.keys(localStorage)
        .filter((k) => k.startsWith("banana-collector-save-slot-v1:"))
        .forEach((k) => localStorage.removeItem(k));
      state = Object.assign(defaultState(), { coins: 4242, playerXp: 1234 });
      state.cloud.linked = true;
      localStorage.setItem("banana-collector-save-v1", JSON.stringify(state));

      const adopted = adoptCurrentSaveAsIdentity(accountIdentity("ancien"));
      return {
        adopted,
        coins: state.coins,
        xp: state.playerXp,
        identity: localStorage.getItem("banana-collector-active-identity-v1"),
      };
    });

    assert.strictEqual(migrated.adopted, true, "an unclaimed legacy save must be adopted");
    assert.strictEqual(migrated.coins, 4242, "adopting a legacy save must NOT wipe it");
    assert.strictEqual(migrated.xp, 1234, "adopting a legacy save must keep progression that never reaches the server");
    assert.strictEqual(migrated.identity, "user:ancien", "the legacy save must be claimed by the signed-in account");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

// Exigence explicite : TOUT compte nouvellement créé doit voir le mini
// tutoriel. Vérifié par le vrai parcours d'interface (formulaire + création
// + rechargement), pas seulement sur l'état — c'est ce que le joueur voit.
async function runSignUpShowsTutorialScenario() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    const pageErrors = [];
    page.on("pageerror", (e) => pageErrors.push(String(e)));

    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);

    // Une partie invité qui a déjà vu le tutoriel et bien avancé : sans
    // sauvegardes séparées, le compte créé héritait de ce welcomeSeen et le
    // tutoriel ne s'affichait jamais (symptôme signalé).
    await page.evaluate(() => {
      document.getElementById("welcome-modal").classList.add("hidden");
      state.onboarding.welcomeSeen = true;
      state.coins = 9999;
      state.totalRolls = 60;
      saveState();

      CLOUD.available = true;
      // Reproduit fidèlement ce que fait le vrai signUp() : bascule sur la
      // sauvegarde du nouveau compte, marque le lien, demande un rechargement.
      CLOUD.signUp = async (username) => {
        switchToIdentity(accountIdentity(username));
        state.cloud.linked = true;
        saveState();
        return { ok: true, reload: true };
      };
      CLOUD.setAvatar = () => {};
      CLOUD.isAdmin = () => false;
      CLOUD.isBanned = () => false;
      CLOUD.hasUnreadSupportReply = async () => false;
      CLOUD.adminListSupportThreads = async () => [];
      CLOUD.pushAll = async () => {};
    });

    await page.click("#account-btn");
    await page.waitForTimeout(200);
    // Bascule le formulaire en mode création de compte.
    await page.click("#account-switch-mode-btn");
    await page.waitForTimeout(200);
    await page.fill("#account-username-input", "toutneuf");
    await page.fill("#account-password-input", "motdepasse123");

    await Promise.all([
      page.waitForEvent("load", { timeout: 15000 }),
      page.click("#account-submit-btn"),
    ]);
    await page.waitForTimeout(400);

    const welcomeVisible = await page.$eval("#welcome-modal", (el) => !el.classList.contains("hidden"));
    assert.ok(welcomeVisible, "a newly created account MUST show the welcome tutorial, even when the guest had already dismissed it");

    const fresh = await page.evaluate(() => ({ coins: state.coins, totalRolls: state.totalRolls }));
    assert.strictEqual(fresh.coins, 0, `a newly created account must start from a fresh save, got ${fresh.coins} coins`);
    assert.strictEqual(fresh.totalRolls, 0, "a newly created account must start with no rolls");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

const baseRun = run;
async function runAll() {
  await baseRun();
  await runSignUpShowsTutorialScenario();
}

module.exports = { run: runAll };
if (require.main === module) {
  run()
    .then(() => console.log("OK — account-save-slots.test.js"))
    .catch((e) => {
      console.error("FAILED — account-save-slots.test.js:", e.message);
      process.exit(1);
    });
}
