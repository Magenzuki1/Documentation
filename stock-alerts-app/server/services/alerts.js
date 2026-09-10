'use strict';

const store = require('./store');
const push = require('./push');

function today() {
  return new Date().toISOString().slice(0, 10);
}

function pad(n) {
  return String(n).padStart(2, '0');
}

function nowHHMM() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Gere les plages qui traversent minuit (ex: 22:00 -> 07:00)
function isQuietHours(settings) {
  const { quietHoursStart, quietHoursEnd } = settings;
  if (!quietHoursStart || !quietHoursEnd) return false;
  const now = nowHHMM();
  if (quietHoursStart <= quietHoursEnd) {
    return now >= quietHoursStart && now < quietHoursEnd;
  }
  return now >= quietHoursStart || now < quietHoursEnd;
}

async function notify({ title, body, url, tag }, settings) {
  await store.pushAlertHistory({ title, body, url, tag, sentPush: !isQuietHours(settings) });
  if (isQuietHours(settings)) return;
  await push.sendToAll({ title, body, url, tag });
}

/**
 * Compare les cours recus a l'etat "deja alerte aujourd'hui" pour eviter
 * de spammer a chaque cycle une fois le seuil franchi.
 */
async function evaluatePriceAlerts(quotes, watchlistBySymbol, settings) {
  if (!settings.movePercent) return;
  const lastPrices = await store.getLastPrices();
  const updated = { ...lastPrices };

  for (const quote of quotes) {
    if (quote.error || typeof quote.changePercent !== 'number') continue;
    const stock = watchlistBySymbol[quote.symbol];
    if (!stock) continue;
    if (!settings.sectors?.[stock.sector]) continue;

    const direction = quote.changePercent >= 0 ? 'up' : 'down';
    const state = lastPrices[quote.symbol] || {};
    const alreadyAlerted = state.date === today() && state.direction === direction;
    const crossed = Math.abs(quote.changePercent) >= settings.movePercent;

    if (crossed && !alreadyAlerted) {
      const arrow = direction === 'up' ? '↑' : '↓';
      await notify(
        {
          title: `${arrow} ${stock.name} ${quote.changePercent.toFixed(1)}%`,
          body: `${quote.price} ${quote.currency || ''} (veille: ${quote.previousClose ?? '?'})`,
          url: '/',
          tag: `price-${quote.symbol}`,
        },
        settings
      );
      updated[quote.symbol] = { date: today(), direction, price: quote.price };
    } else if (!crossed && state.date === today()) {
      // le titre est repasse sous le seuil : on reautorise une future alerte
      updated[quote.symbol] = { date: today(), direction: null, price: quote.price };
    }
  }

  await store.saveLastPrices(updated);
}

async function evaluateNewsAlerts(newsItems, settings) {
  if (!settings.newsAlerts) return;
  const seen = new Set(await store.getSeenNews());
  const fresh = newsItems.filter((item) => !seen.has(item.id));
  if (fresh.length === 0) return;

  // Limite le nombre de notifications envoyees en une seule fois
  const toNotify = fresh.filter((item) => !item.sector || settings.sectors?.[item.sector]).slice(0, 5);

  for (const item of toNotify) {
    const label = item.company ? item.company : item.sector === 'sante' ? 'Sante/biotech' : 'Energie';
    await notify(
      {
        title: `📰 ${label}`,
        body: item.title,
        url: item.link,
        tag: `news-${item.id}`,
      },
      settings
    );
  }

  await store.addSeenNews(fresh.map((i) => i.id));
}

module.exports = { evaluatePriceAlerts, evaluateNewsAlerts, isQuietHours };
