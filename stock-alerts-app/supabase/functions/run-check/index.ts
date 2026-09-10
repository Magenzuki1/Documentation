// Execute un cycle unique de verification (cours + actualites + alertes),
// appele toutes les ~10 minutes par pg_cron (voir la migration SQL associee).
// C'est ce qui permet de recevoir les notifications meme quand ton PC ou ton
// telephone ne sont pas allumes.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { WATCHLIST } from "../_shared/watchlist.ts";
import { fetchQuotes } from "../_shared/prices.ts";
import { fetchAllNews } from "../_shared/news.ts";
import { evaluatePriceAlerts, evaluateNewsAlerts } from "../_shared/alerts.ts";
import { store } from "../_shared/store.ts";

const watchlistBySymbol = Object.fromEntries(WATCHLIST.map((s) => [s.symbol, s]));

Deno.serve(async (_req: Request) => {
  const startedAt = new Date().toISOString();
  try {
    const quotes = await fetchQuotes(WATCHLIST);
    const settings = await store.getSettings();
    await evaluatePriceAlerts(quotes, watchlistBySymbol, settings);
    await store.saveLatestQuotes(quotes);

    const news = await fetchAllNews(WATCHLIST);
    await evaluateNewsAlerts(news, settings);
    await store.saveLatestNews(news);

    const okQuotes = quotes.filter((q: any) => !q.error).length;
    const summary = {
      ok: true,
      startedAt,
      finishedAt: new Date().toISOString(),
      quotes: { total: quotes.length, ok: okQuotes },
      news: { total: news.length },
    };
    console.log("[run-check]", JSON.stringify(summary));
    return new Response(JSON.stringify(summary), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    console.error("[run-check] echec:", err);
    return new Response(JSON.stringify({ ok: false, error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
