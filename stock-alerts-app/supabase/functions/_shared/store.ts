// Acces a l'etat de l'application dans Postgres (via l'API REST de Supabase),
// avec la cle service_role injectee automatiquement dans chaque Edge Function
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) : contourne les policies RLS,
// jamais exposee au navigateur.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function sb(path: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase ${options.method || "GET"} ${path} -> HTTP ${res.status}: ${text}`);
  }
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export interface PushSubscriptionRecord {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  [key: string]: unknown;
}

export interface Settings {
  movePercent: number;
  sectors: { sante: boolean; energie: boolean };
  newsAlerts: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

const DEFAULT_SETTINGS: Settings = {
  movePercent: 3,
  sectors: { sante: true, energie: true },
  newsAlerts: true,
  quietHoursStart: null,
  quietHoursEnd: null,
};

function rowToSettings(row: any): Settings {
  if (!row) return { ...DEFAULT_SETTINGS };
  return {
    movePercent: Number(row.move_percent),
    sectors: row.sectors || DEFAULT_SETTINGS.sectors,
    newsAlerts: row.news_alerts,
    quietHoursStart: row.quiet_hours_start,
    quietHoursEnd: row.quiet_hours_end,
  };
}

export const store = {
  async getSecrets() {
    const rows = await sb("app_secrets?id=eq.default&select=*");
    const row = rows?.[0] || {};
    return {
      vapidPublicKey: row.vapid_public_key as string | null,
      vapidPrivateKey: row.vapid_private_key as string | null,
      vapidContactEmail: (row.vapid_contact_email as string | null) || "mailto:admin@example.com",
    };
  },

  async getSubscriptions(): Promise<PushSubscriptionRecord[]> {
    const rows = await sb("push_subscriptions?select=subscription");
    return rows.map((r: any) => r.subscription);
  },
  async addSubscription(sub: PushSubscriptionRecord) {
    await sb("push_subscriptions", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify([{ endpoint: sub.endpoint, subscription: sub }]),
    });
  },
  async removeSubscription(endpoint: string) {
    await sb(`push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: "DELETE" });
  },

  async getSettings(): Promise<Settings> {
    const rows = await sb("app_settings?id=eq.default&select=*");
    return rowToSettings(rows?.[0]);
  },
  async saveSettings(partial: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const merged = { ...current, ...partial };
    await sb("app_settings?id=eq.default", {
      method: "PATCH",
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
    const rows = await sb("alerts_history?select=*&order=created_at.desc&limit=300");
    return rows.map((r: any) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      url: r.url,
      tag: r.tag,
      sentPush: r.sent_push,
      createdAt: r.created_at,
    }));
  },
  async pushAlertHistory(entry: { title: string; body?: string; url?: string; tag?: string; sentPush: boolean }) {
    await sb("alerts_history", {
      method: "POST",
      body: JSON.stringify([
        { title: entry.title, body: entry.body, url: entry.url, tag: entry.tag, sent_push: entry.sentPush },
      ]),
    });
  },

  async getLastPrices(): Promise<Record<string, { date: string; direction: string | null; price: number }>> {
    const rows = await sb("last_prices?select=*");
    const map: Record<string, { date: string; direction: string | null; price: number }> = {};
    for (const r of rows) map[r.symbol] = { date: r.date, direction: r.direction, price: r.price };
    return map;
  },
  async saveLastPrices(pricesMap: Record<string, { date: string; direction: string | null; price: number }>) {
    const rows = Object.entries(pricesMap).map(([symbol, v]) => ({
      symbol,
      date: v.date,
      direction: v.direction,
      price: v.price,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    await sb("last_prices", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(rows),
    });
  },

  async getSeenNews(): Promise<string[]> {
    const rows = await sb("seen_news?select=id&order=seen_at.desc&limit=2000");
    return rows.map((r: any) => r.id);
  },
  async addSeenNews(ids: string[]) {
    if (!ids.length) return;
    await sb("seen_news", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(ids.map((id) => ({ id }))),
    });
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await sb(`seen_news?seen_at=lt.${encodeURIComponent(cutoff)}`, { method: "DELETE" }).catch(() => {});
  },

  async saveLatestQuotes(quotes: any[]) {
    const rows = quotes.map((q) => ({
      symbol: q.symbol,
      name: q.name,
      sector: q.sector,
      price: q.error ? null : q.price,
      previous_close: q.error ? null : q.previousClose,
      change_percent: q.error ? null : q.changePercent,
      currency: q.error ? null : q.currency,
      error: q.error || null,
      updated_at: new Date().toISOString(),
    }));
    if (rows.length === 0) return;
    await sb("latest_quotes", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(rows),
    });
  },
  async getLatestQuotes() {
    return await sb("latest_quotes?select=*&order=symbol.asc");
  },

  async saveLatestNews(items: any[]) {
    if (items.length === 0) return;
    const rows = items.slice(0, 60).map((n) => ({
      id: n.id,
      title: n.title,
      link: n.link,
      company: n.company,
      sector: n.sector,
      source: n.source,
      pub_date: n.pubDate ? new Date(n.pubDate).toISOString() : null,
      fetched_at: new Date().toISOString(),
    }));
    await sb("latest_news", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(rows),
    });
  },
  async getLatestNews() {
    return await sb("latest_news?select=*&order=pub_date.desc&limit=60");
  },

  async getLastQuoteUpdate(): Promise<string | null> {
    const rows = await sb("latest_quotes?select=updated_at&order=updated_at.desc&limit=1");
    return rows?.[0]?.updated_at || null;
  },
  async getLastNewsUpdate(): Promise<string | null> {
    const rows = await sb("latest_news?select=fetched_at&order=fetched_at.desc&limit=1");
    return rows?.[0]?.fetched_at || null;
  },
};
