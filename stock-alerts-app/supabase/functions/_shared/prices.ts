// Recuperation des cours via l'API "chart" (non officielle) de Yahoo Finance.

import type { Stock } from "./watchlist.ts";

const CHART_URL = (symbol: string) =>
  `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d`;

async function fetchOne(stock: Stock) {
  try {
    const res = await fetch(CHART_URL(stock.symbol), {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PersonalStockAlerts/1.0)",
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} pour ${stock.symbol}`);
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) {
      const err = json?.chart?.error?.description || "reponse vide";
      throw new Error(`Pas de donnees pour ${stock.symbol}: ${err}`);
    }
    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.previousClose ?? meta.chartPreviousClose;
    const changePercent = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

    return {
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      price,
      previousClose: prevClose,
      changePercent,
      currency: meta.currency,
      updatedAt: new Date().toISOString(),
    };
  } catch (err) {
    return { symbol: stock.symbol, name: stock.name, sector: stock.sector, error: (err as Error).message };
  }
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function fetchQuotes(watchlist: Stock[]) {
  return mapWithConcurrency(watchlist, 5, fetchOne);
}
