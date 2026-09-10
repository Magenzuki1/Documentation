'use strict';

/**
 * Persistance de l'etat de l'application dans Supabase (au lieu de fichiers
 * locaux), pour que le tableau de bord (lance sur ton PC) et le controleur
 * planifie (GitHub Actions, qui tourne 24/7 sans machine a toi) partagent
 * exactement le meme etat : abonnements push, reglages, historique, cours
 * deja alertes, actualites deja vues.
 *
 * IMPORTANT : la cle utilisee ici (SUPABASE_ANON_KEY) ne doit JAMAIS etre
 * envoyee au navigateur. Elle reste uniquement cote serveur (.env local, ou
 * secret GitHub Actions) : dans cette appli, le navigateur ne parle qu'a
 * l'API Express (routes/api.js), jamais directement a Supabase.
 */

const config = require('../config');

function assertConfigured() {
  if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error(
      'SUPABASE_URL / SUPABASE_ANON_KEY manquants dans .env (ou secrets GitHub Actions). ' +
        'Voir le README pour la configuration Supabase.'
    );
  }
}

async function sb(path, options = {}) {
  assertConfigured();
  const res = await fetch(`${config.supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${config.supabaseKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${options.method || 'GET'} ${path} -> HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

const DEFAULT_SETTINGS = {
  movePercent: 3,
  sectors: { sante: true, energie: true },
  newsAlerts: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

function rowToSettings(row) {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    movePercent: Number(row.move_percent),
    sectors: row.sectors || DEFAULT_SETTINGS.sectors,
    newsAlerts: row.news_alerts,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
  };
}

module.exports = {
  async getSubscriptions() {
    const rows = await sb('push_subscriptions?select=subscription');
    return rows.map((r) => r.subscription);
  },
  async addSubscription(sub) {
    await sb('push_subscriptions', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify([{ endpoint: sub.endpoint, subscription: sub }]),
    });
  },
  async removeSubscription(endpoint) {
    await sb(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: 'DELETE' });
  },

  async getSettings() {
    const rows = await sb('app_settings?id=eq.default&select=*');
    return rowToSettings(rows?.[0]);
  },
  async saveSettings(partial) {
    const current = await this.getSettings();
    const merged = { ...current, ...partial };
    await sb('app_settings?id=eq.default', {
      method: 'PATCH',
      body: JSON.stringify({
        move_percent: merged.movePercent,
        sectors: merged.sectors,
        news_alerts: merged.newsAlerts,
        quiet_hours_start: merged.quietHoursStart,
        quiet_hours_end: merged.quietHoursEnd,
        updated_at: new Date().toISOString(),
      }),
    });
    return merged;
  },

  async getAlertsHistory() {
    const rows = await sb('alerts_history?select=*&order=created_at.desc&limit=300');
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      url: r.url,
      tag: r.tag,
      sentPush: r.sent_push,
      createdAt: r.created_at,
    }));
  },
  async pushAlertHistory(entry) {
    await sb('alerts_history', {
      method: 'POST',
      body: JSON.stringify([
        { title: entry.title, body: entry.body, url: entry.url, tag: entry.tag, sent_push: entry.sentPush },
      ]),
    });
  },

  async getLastPrices() {
    const rows = await sb('last_prices?select=*');
    const map = {};
    for (const r of rows) {
      map[r.symbol] = { date: r.date, direction: r.direction, price: r.price };
    }
    return map;
  },
  async saveLastPrices(pricesMap) {
    const rows = Object.entries(pricesMap).map(([symbol, v]) => ({
      symbol,
      date: v.date,
      direction: v.direction,
      price: v.price,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    await sb('last_prices', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(rows),
    });
  },

  async getSeenNews() {
    const rows = await sb('seen_news?select=id&order=seen_at.desc&limit=2000');
    return rows.map((r) => r.id);
  },
  async addSeenNews(ids) {
    if (!ids.length) return;
    await sb('seen_news', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(ids.map((id) => ({ id }))),
    });
    // nettoyage : on ne garde pas indefiniment l'historique des actus vues
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await sb(`seen_news?seen_at=lt.${encodeURIComponent(cutoff)}`, { method: 'DELETE' }).catch(() => {});
  },
};
