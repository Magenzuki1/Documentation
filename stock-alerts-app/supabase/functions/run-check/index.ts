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

// "scope" permet a pg_cron d'appeler cette fonction a des cadences differentes
// pour les cours (frequents, peu couteux) et les actualites (moins frequentes,
// pour rester sous le radar anti-bot de Google News). Sans parametre : les deux
// (utile pour un appel manuel complet).
Deno.serve(async (req: Request) => {
  const startedAt = new Date().toISOString();
  const scope = new URL(req.url).searchParams.get("scope");
  const doQuotes = scope !== "news";
  const doNews = scope !== "quotes";
  try {
    const settings = await store.getSettings();
    let quotes: any[] = [];
    let news: any[] = [];

    if (doQuotes) {
      quotes = await fetchQuotes(WATCHLIST);
      await evaluatePriceAlerts(quotes, watchlistBySymbol, settings);
      await store.saveLatestQuotes(quotes);
    }

    if (doNews) {
      news = await fetchAllNews(WATCHLIST);
      await evaluateNewsAlerts(news, settings);
      await store.saveLatestNews(news);
    }

    const okQuotes = quotes.filter((q: any) => !q.error).length;
    const summary = {
      ok: true,
      startedAt,
      finishedAt: new Date().toISOString(),
      scope: scope || "all",
      quotes: doQuotes ? { total: quotes.length, ok: okQuotes } : undefined,
      news: doNews ? { total: news.length } : undefined,
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
