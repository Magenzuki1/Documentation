'use strict';

/**
 * Execute un cycle unique de verification (cours + actualites) puis quitte.
 * C'est ce script que le workflow GitHub Actions lance toutes les ~10
 * minutes pour que les alertes fonctionnent meme quand ton PC ou ton
 * telephone ne sont pas allumes.
 *
 * Utilisation locale : node server/scripts/run-check.js
 */

const { WATCHLIST } = require('../watchlist');
const { checkPrices, checkNews } = require('../services/cycle');

const watchlistBySymbol = Object.fromEntries(WATCHLIST.map((s) => [s.symbol, s]));

(async () => {
  console.log(`[run-check] ${new Date().toISOString()} debut du cycle`);

  const quotes = await checkPrices(WATCHLIST, watchlistBySymbol);
  const okCount = quotes.filter((q) => !q.error).length;
  console.log(`[run-check] cours : ${okCount}/${quotes.length} valeurs recuperees`);

  const news = await checkNews(WATCHLIST);
  console.log(`[run-check] actualites : ${news.length} articles analyses`);

  console.log('[run-check] cycle termine');
})().catch((err) => {
  console.error('[run-check] echec:', err);
  process.exit(1);
});
