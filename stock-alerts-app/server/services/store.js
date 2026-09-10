'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const FILES = {
  subscriptions: path.join(DATA_DIR, 'subscriptions.json'),
  settings: path.join(DATA_DIR, 'settings.json'),
  alertsHistory: path.join(DATA_DIR, 'alerts-history.json'),
  lastPrices: path.join(DATA_DIR, 'last-prices.json'),
  seenNews: path.join(DATA_DIR, 'seen-news.json'),
};

const DEFAULT_SETTINGS = {
  movePercent: 3,
  sectors: { sante: true, energie: true },
  newsAlerts: true,
  quietHoursStart: null, // ex: "22:00"
  quietHoursEnd: null, // ex: "07:00"
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  ensureDataDir();
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`[store] lecture impossible de ${file}:`, err.message);
    return fallback;
  }
}

function writeJson(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  getSubscriptions() {
    return readJson(FILES.subscriptions, []);
  },
  addSubscription(sub) {
    const subs = readJson(FILES.subscriptions, []);
    const exists = subs.some((s) => s.endpoint === sub.endpoint);
    if (!exists) {
      subs.push(sub);
      writeJson(FILES.subscriptions, subs);
    }
    return subs;
  },
  removeSubscription(endpoint) {
    const subs = readJson(FILES.subscriptions, []).filter((s) => s.endpoint !== endpoint);
    writeJson(FILES.subscriptions, subs);
    return subs;
  },

  getSettings() {
    return { ...DEFAULT_SETTINGS, ...readJson(FILES.settings, {}) };
  },
  saveSettings(partial) {
    const merged = { ...this.getSettings(), ...partial };
    writeJson(FILES.settings, merged);
    return merged;
  },

  getAlertsHistory() {
    return readJson(FILES.alertsHistory, []);
  },
  pushAlertHistory(entry) {
    const history = readJson(FILES.alertsHistory, []);
    history.unshift({ ...entry, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
    const trimmed = history.slice(0, 300);
    writeJson(FILES.alertsHistory, trimmed);
    return trimmed;
  },

  getLastPrices() {
    return readJson(FILES.lastPrices, {});
  },
  saveLastPrices(prices) {
    writeJson(FILES.lastPrices, prices);
  },

  getSeenNews() {
    return readJson(FILES.seenNews, []);
  },
  saveSeenNews(ids) {
    // garde les 500 dernieres entrees vues pour eviter que le fichier ne grossisse indefiniment
    writeJson(FILES.seenNews, ids.slice(-500));
  },
};
