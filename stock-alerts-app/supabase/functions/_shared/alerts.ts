// Logique de declenchement des alertes (portage direct de server/services/alerts.js).

import { store, type Settings } from "./store.ts";
import { sendToAll } from "./push.ts";
import type { Stock } from "./watchlist.ts";
import { SECTOR_LABELS } from "./watchlist.ts";
import type { NewsItem } from "./news.ts";

function today() {
  return new Date().toISOString().slice(0, 10);
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function nowHHMM() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isQuietHours(settings: Settings): boolean {
  const { quietHoursStart, quietHoursEnd } = settings;
  if (!quietHoursStart || !quietHoursEnd) return false;
  const now = nowHHMM();
  if (quietHoursStart <= quietHoursEnd) return now >= quietHoursStart && now < quietHoursEnd;
  return now >= quietHoursStart || now < quietHoursEnd;
}

async function notify(
  payload: {
    title: string;
    body?: string;
    url?: string;
    tag?: string;
    catalyst?: string | null;
    symbol?: string | null;
    company?: string | null;
  },
  settings: Settings
) {
  await store.pushAlertHistory({ ...payload, sentPush: !isQuietHours(settings) });
  if (isQuietHours(settings)) return;
  await sendToAll(payload);
}

export async function evaluatePriceAlerts(
  quotes: any[],
  watchlistBySymbol: Record<string, Stock>,
  settings: Settings
) {
  if (!settings.moveUpPercent && !settings.moveDownPercent) return;
  const lastPrices = await store.getLastPrices();
  const updated = { ...lastPrices };

  for (const quote of quotes) {
    if (quote.error || typeof quote.changePercent !== "number") continue;
    const stock = watchlistBySymbol[quote.symbol];
    if (!stock) continue;
    if (!settings.sectors?.[stock.sector]) continue;

    const direction = quote.changePercent >= 0 ? "up" : "down";
    // Seuils independants : une hausse de +5% et une baisse de -2% peuvent
    // declencher des notifications a des niveaux differents.
    const threshold = direction === "up" ? settings.moveUpPercent : settings.moveDownPercent;
    if (!threshold) continue;
    const state = lastPrices[quote.symbol] || ({} as any);
    const alreadyAlerted = state.date === today() && state.direction === direction;
    const crossed = Math.abs(quote.changePercent) >= threshold;

    if (crossed && !alreadyAlerted) {
      const arrow = direction === "up" ? "↑" : "↓";
      await notify(
        {
          title: `${arrow} ${stock.name} ${quote.changePercent.toFixed(1)}%`,
          body: `${quote.price} ${quote.currency || ""} (veille: ${quote.previousClose ?? "?"})`,
          url: "/",
          tag: `price-${quote.symbol}`,
          symbol: quote.symbol,
          company: stock.name,
        },
        settings
      );
      updated[quote.symbol] = { date: today(), direction, price: quote.price };
    } else if (!crossed && state.date === today()) {
      updated[quote.symbol] = { date: today(), direction: null, price: quote.price };
    }
  }

  await store.saveLastPrices(updated);
}

export async function evaluateNewsAlerts(newsItems: NewsItem[], settings: Settings) {
  if (!settings.newsAlerts) return;
  const seen = new Set(await store.getSeenNews());
  const fresh = newsItems.filter((item) => !seen.has(item.id));
  if (fresh.length === 0) return;

  const inSector = (item: NewsItem) => !item.sector || settings.sectors?.[item.sector];

  // Les catalyseurs potentiels (resultats d'essai, reglementaire, contrat...)
  // sont toujours notifies, sans limite : c'est le signal le plus utile.
  // Les autres actualites restent plafonnees pour ne pas noyer le telephone.
  const catalystItems = fresh.filter((item) => item.catalyst && inSector(item));
  const regularItems = fresh.filter((item) => !item.catalyst && inSector(item)).slice(0, 5);

  for (const item of catalystItems) {
    const label = item.company ? item.company : (item.sector && SECTOR_LABELS[item.sector]) || "Bourse";
    await notify(
      {
        title: `🧪 Catalyseur potentiel — ${label}`,
        body: `[${item.catalyst}] ${item.title}`,
        url: item.link,
        tag: `catalyst-${item.id}`,
        catalyst: item.catalyst,
        symbol: item.symbol,
        company: item.company,
      },
      settings
    );
  }

  for (const item of regularItems) {
    const label = item.company ? item.company : (item.sector && SECTOR_LABELS[item.sector]) || "Bourse";
    await notify(
      {
        title: `📰 ${label}`,
        body: item.title,
        url: item.link,
        tag: `news-${item.id}`,
        catalyst: null,
        symbol: item.symbol,
        company: item.company,
      },
      settings
    );
  }

  await store.addSeenNews(fresh.map((i) => i.id));
}
