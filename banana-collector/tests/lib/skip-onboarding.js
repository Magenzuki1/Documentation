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
    document.querySelectorAll(".tab-btn.hidden").forEach((b) => b.classList.remove("hidden"));
  });
}

module.exports = { skipOnboardingUi };
