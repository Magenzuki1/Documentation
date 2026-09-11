// API JSON pour le tableau de bord (statique, servi depuis Supabase Storage).
// Fonction publique (verify_jwt=false) : c'est un backend appele en CORS
// depuis le navigateur, pas une page web.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { store } from "../_shared/store.ts";
import { WATCHLIST } from "../_shared/watchlist.ts";
import { fetchHistory } from "../_shared/prices.ts";

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// Les routes en lecture restent publiques (donnees non sensibles), mais les
// routes d'ecriture (reglages, abonnement push) exigent un jeton partage :
// sans ca, n'importe qui connaissant l'URL du projet pourrait modifier les
// seuils d'alerte ou injecter de faux abonnements. Le jeton est distribue
// une fois via un lien (?token=...), sauvegarde cote navigateur - voir
// app.js.
async function hasValidWriteToken(req: Request): Promise<boolean> {
  const auth = req.headers.get("Authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!provided) return false;
  const secrets = await store.getSecrets();
  return Boolean(secrets.writeToken) && provided === secrets.writeToken;
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url);
  let path = url.pathname.replace(/^\/functions\/v1\/app/, "").replace(/^\/app/, "");
  if (path === "") path = "/";

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders() });
  }

  try {
    if (path === "/api/watchlist" && req.method === "GET") {
      return json(WATCHLIST, { headers: corsHeaders() });
    }

    if (path === "/api/quotes" && req.method === "GET") {
      const rows = await store.getLatestQuotes();
      const quotes = rows.map((r: any) => ({
        symbol: r.symbol,
        name: r.name,
        sector: r.sector,
        price: r.price,
        previousClose: r.previous_close,
        changePercent: r.change_percent,
        currency: r.currency,
        fiftyTwoWeekHigh: r.fifty_two_week_high,
        fiftyTwoWeekLow: r.fifty_two_week_low,
        dayHigh: r.day_high,
        dayLow: r.day_low,
        volume: r.volume,
        fullExchangeName: r.full_exchange_name,
        error: r.error,
      }));
      return json(quotes, { headers: corsHeaders() });
    }

    if (path === "/api/news" && req.method === "GET") {
      const rows = await store.getLatestNews();
      const news = rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        link: r.link,
        pubDate: r.pub_date,
        company: r.company,
        sector: r.sector,
        source: r.source,
        catalyst: r.catalyst,
      }));
      return json(news, { headers: corsHeaders() });
    }

    if (path === "/api/history" && req.method === "GET") {
      const symbol = url.searchParams.get("symbol");
      const range = url.searchParams.get("range") || "6mo";
      if (!symbol) return json({ error: "Parametre symbol requis" }, { status: 400, headers: corsHeaders() });
      const history = await fetchHistory(symbol, range);
      return json(history, { headers: corsHeaders() });
    }

    if (path === "/api/status" && req.method === "GET") {
      const [lastPriceUpdate, lastNewsUpdate, subs, secrets] = await Promise.all([
        store.getLastQuoteUpdate(),
        store.getLastNewsUpdate(),
        store.getSubscriptions(),
        store.getSecrets(),
      ]);
      return json(
        {
          lastPriceUpdate,
          lastNewsUpdate,
          subscriptionsCount: subs.length,
          pushConfigured: Boolean(secrets.vapidPublicKey && secrets.vapidPrivateKey),
        },
        { headers: corsHeaders() }
      );
    }

    if (path === "/api/settings" && req.method === "GET") {
      return json(await store.getSettings(), { headers: corsHeaders() });
    }
    if (path === "/api/settings" && req.method === "PUT") {
      if (!(await hasValidWriteToken(req))) {
        return json({ error: "Jeton d'acces manquant ou invalide" }, { status: 401, headers: corsHeaders() });
      }
      const body = await req.json();
      const allowed = ["moveUpPercent", "moveDownPercent", "sectors", "newsAlerts", "quietHoursStart", "quietHoursEnd"];
      const partial: Record<string, unknown> = {};
      for (const key of allowed) if (key in body) partial[key] = body[key];
      const saved = await store.saveSettings(partial);
      return json(saved, { headers: corsHeaders() });
    }

    if (path === "/api/alerts/history" && req.method === "GET") {
      return json(await store.getAlertsHistory(), { headers: corsHeaders() });
    }

    if (path === "/api/push/public-key" && req.method === "GET") {
      const secrets = await store.getSecrets();
      return json({ publicKey: secrets.vapidPublicKey || null }, { headers: corsHeaders() });
    }

    if (path === "/api/push/subscribe" && req.method === "POST") {
      if (!(await hasValidWriteToken(req))) {
        return json({ error: "Jeton d'acces manquant ou invalide" }, { status: 401, headers: corsHeaders() });
      }
      const sub = await req.json();
      if (!sub || !sub.endpoint) return json({ error: "Abonnement push invalide" }, { status: 400 });
      await store.addSubscription(sub);
      return json({ ok: true }, { status: 201, headers: corsHeaders() });
    }

    if (path === "/api/push/unsubscribe" && req.method === "POST") {
      if (!(await hasValidWriteToken(req))) {
        return json({ error: "Jeton d'acces manquant ou invalide" }, { status: 401, headers: corsHeaders() });
      }
      const { endpoint } = await req.json().catch(() => ({}));
      if (endpoint) await store.removeSubscription(endpoint);
      return json({ ok: true }, { headers: corsHeaders() });
    }

    return json({ error: "Not found" }, { status: 404, headers: corsHeaders() });
  } catch (err) {
    console.error("[app] erreur:", err);
    return json({ error: (err as Error).message }, { status: 500, headers: corsHeaders() });
  }
});
