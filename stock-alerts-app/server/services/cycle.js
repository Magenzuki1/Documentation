'use strict';

/**
 * Logique d'un "cycle de verification", partagee entre :
 * - le serveur local (server/index.js), qui l'appelle en boucle pour
 *   alimenter le tableau de bord ;
 * - le script autonome (server/scripts/run-check.js), execute une seule
 *   fois par le workflow GitHub Actions planifie toutes les ~10 minutes,
 *   pour que les alertes fonctionnent meme quand ton PC/telephone sont
 *   eteints.
 */

const store = require('./store');
const { fetchQuotes } = require('./prices');
const { fetchAllNews } = require('./news');
const { evaluatePriceAlerts, evaluateNewsAlerts } = require('./alerts');

async function checkPrices(watchlist, watchlistBySymbol) {
  const quotes = await fetchQuotes(watchlist.map((s) => s.symbol));
  const settings = await store.getSettings();
  await evaluatePriceAlerts(quotes, watchlistBySymbol, settings);
  return quotes;
}

async function checkNews(watchlist) {
  const news = await fetchAllNews(watchlist);
  const settings = await store.getSettings();
  await evaluateNewsAlerts(news, settings);
  return news;
}

module.exports = { checkPrices, checkNews };
