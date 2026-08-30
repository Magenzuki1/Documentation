// Garde-fou contre la classe de bug rencontrée avec banana_catalog : de
// nouvelles bananes ajoutées à data.js sans mise à jour cohérente des
// tables de valeur, des rangs par rareté, ou avec des ids en double.
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);

    const report = await page.evaluate(() => {
      const ids = BANANAS.map((b) => b.id);
      const duplicateIds = ids.filter((id, i) => ids.indexOf(id) !== i);
      const badValues = BANANAS.filter((b) => !(b.value > 0) || !Number.isFinite(b.value));
      const badNumbers = BANANAS.filter((b) => !/^[A-Z]+-\d{3}$/.test(b.number));
      const knownRarities = new Set(RARITY_ORDER);
      const badRarities = BANANAS.filter((b) => !knownRarities.has(b.rarity));
      const missingName = BANANAS.filter((b) => !b.name || !b.name.trim());
      const missingImage = BANANAS.filter((b) => !b.image);
      return {
        total: BANANAS.length,
        normal: NORMAL_BANANAS.length,
        secret: SECRET_BANANAS.length,
        duplicateIds,
        badValues: badValues.map((b) => ({ id: b.id, value: b.value })),
        badNumbers: badNumbers.map((b) => ({ id: b.id, number: b.number })),
        badRarities: badRarities.map((b) => ({ id: b.id, rarity: b.rarity })),
        missingName: missingName.map((b) => b.id),
        missingImage: missingImage.map((b) => b.id),
      };
    });

    assert.strictEqual(report.duplicateIds.length, 0, `duplicate banana ids: ${JSON.stringify(report.duplicateIds)}`);
    assert.strictEqual(report.badValues.length, 0, `bananas with an invalid coin value: ${JSON.stringify(report.badValues)}`);
    assert.strictEqual(report.badNumbers.length, 0, `bananas with a malformed collection number: ${JSON.stringify(report.badNumbers)}`);
    assert.strictEqual(report.badRarities.length, 0, `bananas with an unknown rarity: ${JSON.stringify(report.badRarities)}`);
    assert.strictEqual(report.missingName.length, 0, `bananas without a name: ${JSON.stringify(report.missingName)}`);
    assert.strictEqual(report.missingImage.length, 0, `bananas without an image path: ${JSON.stringify(report.missingImage)}`);
    assert.strictEqual(report.total, report.normal + report.secret, "NORMAL_BANANAS + SECRET_BANANAS must equal BANANAS.length");
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — data-integrity.test.js"))
    .catch((e) => {
      console.error("FAILED — data-integrity.test.js:", e.message);
      process.exit(1);
    });
}
