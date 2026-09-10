'use strict';

const path = require('path');
const express = require('express');

const config = require('./config');
const { WATCHLIST } = require('./watchlist');
const { checkPrices, checkNews } = require('./services/cycle');
const buildApiRouter = require('./routes/api');

const app = express();
app.use(express.json());

const watchlistBySymbol = Object.fromEntries(WATCHLIST.map((s) => [s.symbol, s]));

const cache = {
  quotes: [],
  news: [],
  lastPriceUpdate: null,
  lastNewsUpdate: null,
};

app.use('/api', buildApiRouter({ getCache: () => cache }));
app.use(express.static(path.join(__dirname, '..', 'public')));

async function refreshPrices() {
  try {
    cache.quotes = await checkPrices(WATCHLIST, watchlistBySymbol);
    cache.lastPriceUpdate = new Date().toISOString();
  } catch (err) {
    console.error('[cron] echec rafraichissement des cours:', err.message);
  }
}

async function refreshNews() {
  try {
    cache.news = await checkNews(WATCHLIST);
    cache.lastNewsUpdate = new Date().toISOString();
  } catch (err) {
    console.error('[cron] echec rafraichissement des actualites:', err.message);
  }
}

app.listen(config.port, () => {
  console.log(`\nAlertes Bourse Sante/Energie disponibles sur http://localhost:${config.port}`);
  console.log(
    `Cours rafraichis toutes les ${config.priceIntervalMinutes} min, actus toutes les ${config.newsIntervalMinutes} min.`
  );
  console.log(
    'Rappel : ce rafraichissement local ne tourne que quand ce serveur est lance. ' +
      'Le workflow GitHub Actions prend le relais en continu (voir README).\n'
  );

  // premier rafraichissement immediat au demarrage, puis toutes les N minutes
  refreshPrices();
  refreshNews();
  setInterval(refreshPrices, config.priceIntervalMinutes * 60 * 1000);
  setInterval(refreshNews, config.newsIntervalMinutes * 60 * 1000);
});
