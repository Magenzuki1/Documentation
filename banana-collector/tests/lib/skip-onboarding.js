// Beaucoup de tests interagissent directement avec des onglets/éléments
// (Combat, Économie, Social...) sans jouer le tout début de partie qui les
// déverrouille normalement (voir TAB_UNLOCK_RULES dans app.js) : sans ça,
// ces boutons sont masqués (.hidden) et le message de bienvenue du tout
// premier lancement (#welcome-modal) intercepte tous les clics. Ces tests ne
// portent pas sur l'accueil d'un nouveau joueur, donc on court-circuite les
// deux plutôt que de leur faire rejouer la progression à chaque fois.
async function skipOnboardingUi(page) {
  await page.evaluate(() => {
    const welcome = document.getElementById("welcome-modal");
    if (welcome) welcome.classList.add("hidden");
    if (typeof state !== "undefined" && state.onboarding) state.onboarding.welcomeSeen = true;
    // Marque les onglets comme définitivement débloqués au niveau de
    // l'état (pas seulement en retirant .hidden du DOM) : sans ça, un
    // refreshTabLocks() ultérieur (ex. après CLOUD.init(), qui tourne de
    // façon asynchrone même hors ligne) re-masquerait ces onglets en les
    // ré-évaluant contre le vrai state, défaisant ce court-circuit.
    if (typeof state !== "undefined" && typeof TAB_UNLOCK_RULES !== "undefined") {
      if (!state.tabsUnlocked) state.tabsUnlocked = [];
      for (const tabId of Object.keys(TAB_UNLOCK_RULES)) {
        if (!state.tabsUnlocked.includes(tabId)) state.tabsUnlocked.push(tabId);
      }
      if (typeof saveState === "function") saveState();
    }
    document.querySelectorAll(".tab-btn.hidden").forEach((b) => b.classList.remove("hidden"));
  });
}

module.exports = { skipOnboardingUi };
