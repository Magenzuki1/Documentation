// Vérifie la section "Mes cosmétiques" du profil (Compte) : une liste
// déroulante par catégorie (titre/cadre/effet), ne montrant que ce que le
// joueur possède déjà, et permettant de changer d'équipement en un choix,
// sans passer par l'écran d'achat.
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
    await page.waitForTimeout(200);

    await page.evaluate(() => {
      state.cosmetics.unlocked = ["title_ami_fruits", "title_insomniaque"];
      state.cosmetics.equippedTitle = "title_ami_fruits";
      saveState();
    });

    await page.click("#account-btn");
    await page.waitForTimeout(300);

    const titleSelectValue = await page.$eval("#profile-cosmetic-title-select", (el) => el.value);
    assert.strictEqual(titleSelectValue, "title_ami_fruits", "the title dropdown must show the currently equipped title as selected");

    const titleOptionCount = await page.$$eval("#profile-cosmetic-title-select option", (els) => els.length);
    // "Automatique" + 2 titres possédés = 3 options, jamais les titres non débloqués.
    assert.strictEqual(titleOptionCount, 3, `expected 3 title options (auto + 2 owned), got ${titleOptionCount}`);

    // Le cadre et l'effet doivent aussi être des listes déroulantes, chacune
    // avec au moins l'option "Aucun cadre"/"Aucun effet" (toujours possédée).
    assert.ok(await page.$("#profile-cosmetic-frame-select"), "frame dropdown missing");
    assert.ok(await page.$("#profile-cosmetic-effect-select"), "effect dropdown missing");
    const frameOptionCount = await page.$$eval("#profile-cosmetic-frame-select option", (els) => els.length);
    assert.ok(frameOptionCount >= 1, "expected at least the default 'no frame' option");

    // Changer la sélection du titre l'équipe immédiatement.
    await page.selectOption("#profile-cosmetic-title-select", "title_insomniaque");
    await page.waitForTimeout(200);
    const equippedAfter = await page.evaluate(() => state.cosmetics.equippedTitle);
    assert.strictEqual(equippedAfter, "title_insomniaque", "selecting an owned title in the dropdown must equip it immediately");

    // La modale se re-rend après un changement : le menu doit refléter la
    // nouvelle sélection (pas rester bloqué sur l'ancienne valeur).
    const titleSelectValueAfter = await page.$eval("#profile-cosmetic-title-select", (el) => el.value);
    assert.strictEqual(titleSelectValueAfter, "title_insomniaque", "the dropdown must reflect the newly equipped title after re-render");

    assert.strictEqual(pageErrors.length, 0, `unexpected page errors: ${pageErrors.join(", ")}`);
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — profile-cosmetics.test.js"))
    .catch((e) => {
      console.error("FAILED — profile-cosmetics.test.js:", e.message);
      process.exit(1);
    });
}
