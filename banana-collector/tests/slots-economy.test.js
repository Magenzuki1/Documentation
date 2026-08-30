// Garde-fou d'équilibrage : la machine à sous a été retouchée plusieurs
// fois cette année suite à des retours joueurs ("on gagne quasi jamais",
// puis le contraire). Ce test fige des bornes larges (jamais un test de
// valeur exacte, l'équilibrage doit pouvoir bouger) pour qu'un futur
// changement de SLOT_SYMBOLS ne fasse pas glisser le taux de retour hors
// d'une plage raisonnable sans que ce soit un choix délibéré.
const assert = require("assert");
const { launchChromium } = require("./lib/launch");
const { startServer } = require("./lib/server");

const SPINS = 200000;

async function run() {
  const { server, url } = await startServer();
  const browser = await launchChromium();
  try {
    const page = await browser.newPage();
    await page.goto(`${url}/index.html`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(200);

    const stats = await page.evaluate((spins) => {
      const bet = 100;
      const avgBonusMultiplier =
        SLOT_BONUS_PRIZE_MULTIPLIERS.reduce((a, b) => a + b, 0) / SLOT_BONUS_PRIZE_MULTIPLIERS.length;
      let wagered = 0;
      let returned = 0;
      let netPositiveSpins = 0;
      for (let i = 0; i < spins; i++) {
        const grid = spinSlotGrid();
        const evalRes = evaluateSlotSpin(grid);
        wagered += bet;
        let spinReturn = bet * evalRes.totalMultiplier;
        if (evalRes.bonusTriggered) spinReturn += bet * avgBonusMultiplier;
        returned += spinReturn;
        if (spinReturn > bet) netPositiveSpins++;
      }
      return {
        rtp: returned / wagered,
        netPositiveRate: netPositiveSpins / spins,
      };
    }, SPINS);

    // Bornes larges (voulu ~107% RTP, ~25% de tours nets positifs au moment
    // de l'écriture de ce test) : à ajuster consciemment si l'équilibrage
    // change, pas à resserrer sans raison.
    assert.ok(stats.rtp > 0.85 && stats.rtp < 1.35, `slot RTP out of expected range: ${(stats.rtp * 100).toFixed(1)}%`);
    assert.ok(
      stats.netPositiveRate > 0.12 && stats.netPositiveRate < 0.45,
      `slot net-positive spin rate out of expected range: ${(stats.netPositiveRate * 100).toFixed(1)}%`
    );
  } finally {
    await browser.close();
    server.close();
  }
}

module.exports = { run };
if (require.main === module) {
  run()
    .then(() => console.log("OK — slots-economy.test.js"))
    .catch((e) => {
      console.error("FAILED — slots-economy.test.js:", e.message);
      process.exit(1);
    });
}
