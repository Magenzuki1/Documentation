'use strict';

const path = require('path');
const express = require('express');

const config = require('./config');
const { WATCHLIST } = require('./watchlist');
const store = require('./services/store');
const { fetchQuotes } = require('./services/prices');
const { fetchAllNews } = require('./services/news');
const { evaluatePriceAlerts, evaluateNewsAlerts } = require('./services/alerts');
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
    const symbols = WATCHLIST.map((s) => s.symbol);
    const quotes = await fetchQuotes(symbols);
    cache.quotes = quotes;
    cache.lastPriceUpdate = new Date().toISOString();

    const settings = store.getSettings();
    await evaluatePriceAlerts(quotes, watchlistBySymbol, settings);
  } catch (err) {
    console.error('[cron] echec rafraichissement des cours:', err.message);
  }
}

async function refreshNews() {
  try {
    const news = await fetchAllNews(WATCHLIST);
    cache.news = news;
    cache.lastNewsUpdate = new Date().toISOString();

    const settings = store.getSettings();
    await evaluateNewsAlerts(news, settings);
  } catch (err) {
    console.error('[cron] echec rafraichissement des actualites:', err.message);
  }
}

app.listen(config.port, () => {
  console.log(`\nAlertes Bourse Sante/Energie disponibles sur http://localhost:${config.port}`);
  console.log(`Cours rafraichis toutes les ${config.priceIntervalMinutes} min, actus toutes les ${config.newsIntervalMinutes} min.\n`);

  // premier rafraichissement immediat au demarrage, puis toutes les N minutes
  refreshPrices();
  refreshNews();
  setInterval(refreshPrices, config.priceIntervalMinutes * 60 * 1000);
  setInterval(refreshNews, config.newsIntervalMinutes * 60 * 1000);
});
