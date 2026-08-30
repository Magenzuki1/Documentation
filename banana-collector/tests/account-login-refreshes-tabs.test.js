// Régression signalée par un joueur : après connexion à un compte (ou une
// reconnexion automatique via une session déjà active), les onglets
// Économie/Combat/Social restaient masqués malgré une collection déjà
// riche tout juste rapatriée par pullBananas() (qui met aussi à jour
// state.discovered) — parce que rien ne rappelait refreshTabLocks() une
// fois la connexion terminée, seulement au tout premier chargement de page
// (avant que quoi que ce soit n'ait été rapatrié).
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
    // Cache seulement le message de bienvenue (bloquerait les clics), sans
    // court-circuiter le verrouillage des onglets comme le ferait
    // skipOnboardingUi() — c'est justement ce comportement qui est testé ici.
    await page.evaluate(() => {
      document.getElementById("welcome-modal").classList.add("hidden");
      state.onboarding.welcomeSeen = true;
    });

    // Onglets masqués au départ (collection/tirages neufs), comme un
    // véritable nouveau joueur.
    const combatHiddenBefore = await page.$eval('.tab-btn[data-tab="combat"]', (el) => el.classList.contains("hidden"));
    assert.ok(combatHiddenBefore, "combat tab must start hidden for this test to be meaningful");

    // Mocke CLOUD.signIn() : simule un compte dont la collection déjà riche
    // vient d'être rapatriée (comme le ferait réellement pullBananas()),
    // sans dépendre d'un vrai réseau Supabase.
    await page.evaluate(() => {
      CLOUD.available = true;
      CLOUD.signIn = async () => {
        for (let id = 1; id <= 10 && id <= NORMAL_BANANAS.length; id++) {
          const bananaId = NORMAL_BANANAS[id - 1].id;
          if (!state.discovered.includes(bananaId)) state.discovered.push(bananaId);
        }
        state.cloud.linked = true;
        saveState();
        return { ok: true };
      };
      CLOUD.setAvatar = () => {};
      // Le mock ci-dessus fait passer CLOUD.isLinked() à true sans vraie
      // session Supabase (supabase reste null dans cet environnement de
      // test) : neutralise les quelques appels réseau que le succès de la
      // connexion déclenche en aval (badges de support, pushAll() via
      // renderMarketTab/renderPvpTab), sans rapport avec ce qui est testé ici.
      CLOUD.hasUnreadSupportReply = async () => false;
      CLOUD.adminListSupportThreads = async () => [];
      CLOUD.isAdmin = () => false;
      CLOUD.isBanned = () => false;
      CLOUD.pushAll = async () => {};
    });

    await page.click("#account-btn");
    await page.waitForTimeout(200);
    await page.fill("#account-username-input", "testeur");
    await page.fill("#account-password-input", "motdepasse123");
    await page.click("#account-submit-btn");
    await page.waitForTimeout(300);

    const combatHiddenAfter = await page.$eval('.tab-btn[data-tab="combat"]', (el) => el.classList.contains("hidden"));
    assert.strictEqual(combatHiddenAfter, false, "the combat tab must be revealed right after sign-in once the collection is pulled in, without needing another action first");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — account-login-refreshes-tabs.test.js"))
    .catch((e) => {
      console.error("FAILED — account-login-refreshes-tabs.test.js:", e.message);
      process.exit(1);
    });
}
