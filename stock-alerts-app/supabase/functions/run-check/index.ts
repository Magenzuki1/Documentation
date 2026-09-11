// Execute un cycle unique de verification (cours + actualites + alertes),
// appele toutes les ~10 minutes par pg_cron (voir la migration SQL associee).
// C'est ce qui permet de recevoir les notifications meme quand ton PC ou ton
// telephone ne sont pas allumes.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { WATCHLIST } from "../_shared/watchlist.ts";
import { fetchQuotes, fetchAllSparklines } from "../_shared/prices.ts";
import { fetchAllNews } from "../_shared/news.ts";
import { evaluatePriceAlerts, evaluateNewsAlerts, evaluateHealthAlert } from "../_shared/alerts.ts";
import { store } from "../_shared/store.ts";

const watchlistBySymbol = Object.fromEntries(WATCHLIST.map((s) => [s.symbol, s]));

// Les mini-graphiques (sparklines) ne bougent presque pas d'un cycle de 10
// minutes a l'autre : les recalculer a cette frequence pour 239 valeurs
// solliciterait Yahoo Finance sans raison. Une fois par jour suffit.
const SPARKLINE_INTERVAL_MS = 24 * 60 * 60 * 1000;

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
      await evaluateHealthAlert(quotes, settings);

      const lastSparkline = settings.lastSparklineUpdateAt ? new Date(settings.lastSparklineUpdateAt).getTime() : 0;
      if (Date.now() - lastSparkline > SPARKLINE_INTERVAL_MS) {
        // Lot couteux (239 requetes supplementaires) isole dans son propre
        // try/catch : un echec ou un ralentissement ici ne doit jamais faire
        // rater l'enregistrement des cours ni les alertes de prix.
        try {
          const sparklines = await fetchAllSparklines(WATCHLIST);
          for (const q of quotes) q.sparkline = sparklines[q.symbol] || [];
          await store.saveSettings({ lastSparklineUpdateAt: new Date().toISOString() });
        } catch (err) {
          console.error("[run-check] echec sparklines:", err);
        }
      }

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
