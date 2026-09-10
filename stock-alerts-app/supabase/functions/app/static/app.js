'use strict';

const SECTOR_LABELS = { sante: 'Sante / biotech', energie: 'Energie' };

// Cette page est servie de facon statique depuis Supabase Storage ; l'API
// (donnees + abonnements push) vit dans une Edge Function separee, appelee
// ici en URL absolue (CORS autorise cote fonction).
const API_BASE = 'https://zimqplubdbugurphhucm.supabase.co/functions/v1/app/api/';
const api = (path) => API_BASE + path;

// Chemin de base de la page courante (avec "/" final), utilise uniquement
// pour l'enregistrement du service worker (meme origine que la page).
const BASE = location.pathname.endsWith('/') ? location.pathname : `${location.pathname}/`;

// ---------- Tabs ----------
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add('active');
  });
});

// ---------- Formatting helpers ----------
function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return `maj ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
}

function fmtDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

// ---------- Quotes ----------
async function loadQuotes() {
  const [watchlistRes, quotesRes] = await Promise.all([fetch(api('watchlist')), fetch(api('quotes'))]);
  const watchlist = await watchlistRes.json();
  const quotes = await quotesRes.json();
  const quotesBySymbol = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  renderQuoteGroup('quotes-sante', watchlist.filter((s) => s.sector === 'sante'), quotesBySymbol);
  renderQuoteGroup('quotes-energie', watchlist.filter((s) => s.sector === 'energie'), quotesBySymbol);
}

function renderQuoteGroup(containerId, stocks, quotesBySymbol) {
  const container = document.getElementById(containerId);
  container.innerHTML = stocks
    .map((stock) => {
      const q = quotesBySymbol[stock.symbol];
      if (!q || q.error || q.price == null) {
        return `<div class="quote-card error"><div class="name">${stock.name}</div><div class="symbol">${stock.symbol}</div><div class="muted">indisponible</div></div>`;
      }
      const dir = q.changePercent >= 0 ? 'up' : 'down';
      const sign = q.changePercent >= 0 ? '+' : '';
      return `
        <div class="quote-card">
          <div class="name">${stock.name}</div>
          <div class="symbol">${stock.symbol}</div>
          <div class="price-row">
            <span class="price">${Number(q.price).toFixed(2)} ${q.currency || ''}</span>
            <span class="change ${dir}">${sign}${Number(q.changePercent).toFixed(1)}%</span>
          </div>
        </div>`;
    })
    .join('');
}

// ---------- News ----------
async function loadNews() {
  const res = await fetch(api('news'));
  const items = await res.json();
  const list = document.getElementById('news-list');
  list.innerHTML = items
    .slice(0, 40)
    .map((item) => {
      const label = item.company || SECTOR_LABELS[item.sector] || '';
      return `
        <li class="news-item">
          <a href="${item.link}" target="_blank" rel="noopener">${item.title}</a>
          <div class="news-meta">${label} &middot; ${fmtDateTime(item.pubDate)}</div>
        </li>`;
    })
    .join('');
}

// ---------- History ----------
async function loadHistory() {
  const res = await fetch(api('alerts/history'));
  const items = await res.json();
  const list = document.getElementById('history-list');
  list.innerHTML = items
    .map(
      (item) => `
        <li class="history-item">
          <div class="title">${item.title}</div>
          <div class="body">${item.body || ''}</div>
          <div class="history-meta">${fmtDateTime(item.createdAt)}${item.sentPush ? '' : ' &middot; silencieux (ne pas deranger)'}</div>
        </li>`
    )
    .join('');
}

// ---------- Status ----------
async function loadStatus() {
  const res = await fetch(api('status'));
  const status = await res.json();
  document.getElementById('quotes-updated').textContent = fmtTime(status.lastPriceUpdate);
  document.getElementById('news-updated').textContent = fmtTime(status.lastNewsUpdate);
  document.getElementById('push-status').textContent = status.pushConfigured
    ? `Notifications configurees — ${status.subscriptionsCount} appareil(s) abonne(s). Verification automatique toutes les 10 min.`
    : 'Notifications non configurees cote serveur.';
}

// ---------- Settings ----------
async function loadSettings() {
  const res = await fetch(api('settings'));
  const s = await res.json();
  document.getElementById('move-percent').value = s.movePercent;
  document.getElementById('move-percent-value').textContent = `${s.movePercent}%`;
  document.getElementById('sector-sante').checked = Boolean(s.sectors?.sante);
  document.getElementById('sector-energie').checked = Boolean(s.sectors?.energie);
  document.getElementById('news-alerts').checked = Boolean(s.newsAlerts);
  document.getElementById('quiet-start').value = s.quietHoursStart || '';
  document.getElementById('quiet-end').value = s.quietHoursEnd || '';
}

document.getElementById('move-percent').addEventListener('input', (e) => {
  document.getElementById('move-percent-value').textContent = `${e.target.value}%`;
});

document.getElementById('quiet-clear').addEventListener('click', () => {
  document.getElementById('quiet-start').value = '';
  document.getElementById('quiet-end').value = '';
});

document.getElementById('save-settings').addEventListener('click', async () => {
  const payload = {
    movePercent: parseFloat(document.getElementById('move-percent').value),
    sectors: {
      sante: document.getElementById('sector-sante').checked,
      energie: document.getElementById('sector-energie').checked,
    },
    newsAlerts: document.getElementById('news-alerts').checked,
    quietHoursStart: document.getElementById('quiet-start').value || null,
    quietHoursEnd: document.getElementById('quiet-end').value || null,
  };
  await fetch(api('settings'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const status = document.getElementById('settings-status');
  status.textContent = 'Reglages enregistres.';
  setTimeout(() => (status.textContent = ''), 2500);
});

// ---------- Push notifications ----------
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

async function refreshNotifButton() {
  const btn = document.getElementById('notif-btn');
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    btn.textContent = 'Notifications non supportees';
    btn.disabled = true;
    return;
  }
  if (Notification.permission === 'denied') {
    btn.textContent = 'Notifications bloquees (reglages navigateur)';
    btn.disabled = true;
    return;
  }
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  btn.textContent = sub ? 'Notifications activees ✓' : 'Activer les notifications';
}

async function enablePush() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return;

  const reg = await navigator.serviceWorker.ready;
  const { publicKey } = await (await fetch(api('push/public-key'))).json();
  if (!publicKey) {
    alert('Cle VAPID absente cote serveur.');
    return;
  }

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  await fetch(api('push/subscribe'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sub),
  });

  await refreshNotifButton();
}

document.getElementById('notif-btn').addEventListener('click', enablePush);

// ---------- Init ----------
async function refreshAll() {
  await Promise.all([loadQuotes(), loadNews(), loadHistory(), loadStatus()]);
}

async function init() {
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register(`${BASE}service-worker.js`, { scope: BASE });
    } catch (err) {
      console.error('Service worker: echec enregistrement', err);
    }
  }
  await loadSettings();
  await refreshAll();
  await refreshNotifButton();

  setInterval(refreshAll, 60_000);
}

init();
