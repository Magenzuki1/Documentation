// Vérifie la section "Mes cosmétiques" du profil (Compte) : montre tout ce
// que le joueur possède déjà (titres/cadres/effets) et permet de changer le
// titre équipé en un clic, sans passer par l'écran d'achat.
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

    const equippedPillText = await page.$eval(".cosmetic-pill.equipped", (el) => el.textContent);
    assert.ok(equippedPillText.includes("Ami des Fruits"), `expected the equipped title pill to show 'Ami des Fruits', got: ${equippedPillText}`);

    const ownedTitlePillCount = await page.evaluate(() => {
      const group = [...document.querySelectorAll(".profile-cosmetics-group")].find((g) => g.textContent.includes("Titre ("));
      return group.querySelectorAll(".cosmetic-pill").length;
    });
    // Automatique + 2 titres possédés = 3 pastilles, jamais les titres non débloqués.
    assert.strictEqual(ownedTitlePillCount, 3, `expected 3 title pills (auto + 2 owned), got ${ownedTitlePillCount}`);

    const clicked = await page.evaluate(() => {
      const btn = [...document.querySelectorAll(".cosmetic-pill")].find((b) => b.textContent.includes("Insomniaque"));
      if (!btn) return false;
      btn.click();
      return true;
    });
    assert.ok(clicked, "could not find the Insomniaque pill to click");
    await page.waitForTimeout(200);

    const equippedAfter = await page.evaluate(() => state.cosmetics.equippedTitle);
    assert.strictEqual(equippedAfter, "title_insomniaque", "clicking an owned title pill must equip it immediately");

    const newEquippedPillText = await page.$eval(".cosmetic-pill.equipped", (el) => el.textContent);
    assert.ok(newEquippedPillText.includes("Insomniaque"), "the newly equipped pill must now show the checkmark");

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
