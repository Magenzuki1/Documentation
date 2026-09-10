'use strict';

/**
 * Recuperation des cours via l'API (non officielle mais largement utilisee)
 * "chart" de Yahoo Finance. Donnees generalement differees de quelques minutes
 * selon la place de cotation -- pas un flux "temps reel" de niveau professionnel.
 */

const CHART_URL = (symbol) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;

async function fetchOne(symbol) {
  const res = await fetch(CHART_URL(symbol), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PersonalStockAlerts/1.0)',
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${symbol}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    const err = json?.chart?.error?.description || 'reponse vide';
    throw new Error(`Pas de donnees pour ${symbol}: ${err}`);
  }
  const meta = result.meta;
  const price = meta.regularMarketPrice;
  const prevClose = meta.previousClose ?? meta.chartPreviousClose;
  const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

  return {
    symbol,
    price,
    previousClose: prevClose,
    changePercent,
    currency: meta.currency,
    marketState: meta.marketState,
    exchangeName: meta.exchangeName,
    updatedAt: new Date().toISOString(),
  };
}

// Limite la concurrence pour rester correct vis-a-vis de l'API publique
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      try {
        results[current] = await fn(items[current]);
      } catch (err) {
        results[current] = { symbol: items[current], error: err.message };
      }
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function fetchQuotes(symbols) {
  return mapWithConcurrency(symbols, 5, fetchOne);
}

module.exports = { fetchQuotes, fetchOne };
