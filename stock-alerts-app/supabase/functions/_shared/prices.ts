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
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow ?? null,
      dayHigh: meta.regularMarketDayHigh ?? null,
      dayLow: meta.regularMarketDayLow ?? null,
      volume: meta.regularMarketVolume ?? null,
      fullExchangeName: meta.fullExchangeName ?? null,
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
  return mapWithConcurrency(watchlist, 10, fetchOne);
}

const HISTORY_RANGES = new Set(["1j", "1mo", "3mo", "6mo", "1y", "5y"]);

export interface HistoryPoint {
  date: string;
  close: number;
  volume: number | null;
}

export async function fetchHistory(symbol: string, range: string) {
  const safeRange = HISTORY_RANGES.has(range) ? range : "6mo";
  // "1j" = intraday (bougies 5 min sur la seance en cours, se remplit au fil
  // de la journee) ; les autres plages restent en cloture quotidienne.
  const isIntraday = safeRange === "1j";
  const interval = isIntraday ? "5m" : "1d";
  const yahooRange = isIntraday ? "1d" : safeRange;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol
  )}?interval=${interval}&range=${yahooRange}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; PersonalStockAlerts/1.0)",
      Accept: "application/json",
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} pour l'historique de ${symbol}`);
  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) {
    const err = json?.chart?.error?.description || "reponse vide";
    throw new Error(`Pas d'historique pour ${symbol}: ${err}`);
  }

  const timestamps: number[] = result.timestamp || [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close || [];
  const volumes: (number | null)[] = result.indicators?.quote?.[0]?.volume || [];

  const points: HistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const close = closes[i];
    if (close == null) continue;
    points.push({
      date: new Date(timestamps[i] * 1000).toISOString(),
      close,
      volume: volumes[i] ?? null,
    });
  }

  return {
    symbol,
    range: safeRange,
    intraday: isIntraday,
    currency: result.meta?.currency ?? null,
    fiftyTwoWeekHigh: result.meta?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: result.meta?.fiftyTwoWeekLow ?? null,
    points,
  };
}
