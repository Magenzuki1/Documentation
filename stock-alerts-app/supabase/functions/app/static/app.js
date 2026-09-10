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
function formatCompactNumber(n) {
  if (n == null) return '?';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function rangeBar(title, low, high, price) {
  if (low == null || high == null || high <= low) return '';
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low)) * 100));
  return `
    <div class="range-block">
      <span class="range-title muted">${title}</span>
      <div class="range52">
        <span class="range52-label">${Number(low).toFixed(2)}</span>
        <div class="range52-track">
          <div class="range52-fill" style="width:${pct.toFixed(1)}%"></div>
          <span class="range52-marker" style="left:${pct.toFixed(1)}%"></span>
        </div>
        <span class="range52-label">${Number(high).toFixed(2)}</span>
      </div>
    </div>`;
}

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

// Classement du jour, calcule une fois par rafraichissement et reutilise par
// les cartes (badge dore) et l'onglet Classement.
let rankingData = [];

function computeRanking(quotes) {
  const valid = quotes.filter((q) => !q.error && typeof q.changePercent === 'number' && q.price != null);
  const sorted = [...valid].sort((a, b) => b.changePercent - a.changePercent);
  sorted.forEach((q, i) => (q.rank = i + 1));
  return sorted;
}

async function loadQuotes() {
  const [watchlistRes, quotesRes] = await Promise.all([fetch(api('watchlist')), fetch(api('quotes'))]);
  const watchlist = await watchlistRes.json();
  const quotes = await quotesRes.json();
  const quotesBySymbol = Object.fromEntries(quotes.map((q) => [q.symbol, q]));

  rankingData = computeRanking(quotes);
  const rankBySymbol = Object.fromEntries(rankingData.map((q) => [q.symbol, q.rank]));

  renderQuoteGroup('quotes-sante', watchlist.filter((s) => s.sector === 'sante'), quotesBySymbol, rankBySymbol);
  renderQuoteGroup('quotes-energie', watchlist.filter((s) => s.sector === 'energie'), quotesBySymbol, rankBySymbol);
  renderRanking();
}

function renderQuoteGroup(containerId, stocks, quotesBySymbol, rankBySymbol) {
  const container = document.getElementById(containerId);
  container.innerHTML = stocks
    .map((stock) => {
      const q = quotesBySymbol[stock.symbol];
      if (!q || q.error || q.price == null) {
        return `<div class="quote-card error" data-symbol="${stock.symbol}" data-name="${stock.name}"><div class="name">${stock.name}</div><div class="symbol">${stock.symbol}</div><div class="muted">indisponible</div></div>`;
      }
      const rank = rankBySymbol[stock.symbol];
      const isGold = rank && rank <= 3 && q.changePercent > 0;
      const dir = q.changePercent >= 0 ? 'up' : 'down';
      const tier = isGold ? 'gold' : dir;
      const sign = q.changePercent >= 0 ? '+' : '';
      const arrow = q.changePercent >= 0 ? '▲' : '▼';
      const medal = isGold ? MEDALS[rank] : '';
      return `
        <div class="quote-card tier-${tier}" data-symbol="${stock.symbol}" data-name="${stock.name}" tabindex="0" role="button">
          ${medal ? `<span class="medal-badge">${medal}</span>` : ''}
          <div class="name">${stock.name}</div>
          <div class="symbol">${stock.symbol}</div>
          <div class="price-row">
            <span class="price">${Number(q.price).toFixed(2)} ${q.currency || ''}</span>
            <span class="change ${dir}">${arrow} ${sign}${Number(q.changePercent).toFixed(1)}%</span>
          </div>
          ${rangeBar('Aujourd’hui', q.dayLow, q.dayHigh, q.price)}
          ${rangeBar('52 semaines', q.fiftyTwoWeekLow, q.fiftyTwoWeekHigh, q.price)}
          <div class="quote-extra muted">
            ${q.volume != null ? `Vol. ${formatCompactNumber(q.volume)}` : ''}
          </div>
        </div>`;
    })
    .join('');

  container.querySelectorAll('.quote-card:not(.error)').forEach((card) => {
    card.addEventListener('click', () => openChart(card.dataset.symbol, card.dataset.name));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openChart(card.dataset.symbol, card.dataset.name);
      }
    });
  });
}

// ---------- Classement ----------
let rankingSortDir = 'desc'; // 'desc' = meilleure d'abord, 'asc' = moins bonne d'abord

document.getElementById('ranking-filter').addEventListener('click', (e) => {
  const btn = e.target.closest('.range-btn');
  if (!btn) return;
  document.querySelectorAll('#ranking-filter .range-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  rankingSortDir = btn.dataset.dir;
  renderRanking();
  // Sur une longue liste, remonter en haut apres le tri : sinon, si on etait
  // scrolle plus bas, le changement de tri n'est pas visible et donne
  // l'impression que le bouton ne fait rien.
  document.getElementById('panel-ranking').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

function renderRanking() {
  const list = document.getElementById('ranking-list');
  if (!list) return;
  if (rankingData.length === 0) {
    list.innerHTML = '<p class="muted">Pas encore de donnees.</p>';
    return;
  }
  const maxAbs = Math.max(...rankingData.map((q) => Math.abs(q.changePercent)), 0.1);
  const ordered = rankingSortDir === 'asc' ? [...rankingData].reverse() : rankingData;
  list.innerHTML = ordered
    .map((q) => {
      const dir = q.changePercent >= 0 ? 'up' : 'down';
      const isGold = q.rank <= 3 && q.changePercent > 0;
      const tier = isGold ? 'gold' : dir;
      const sign = q.changePercent >= 0 ? '+' : '';
      const barPct = (Math.abs(q.changePercent) / maxAbs) * 100;
      const medal = isGold ? MEDALS[q.rank] : '';
      return `
        <li class="rank-row tier-${tier}" data-symbol="${q.symbol}" data-name="${q.name}" tabindex="0" role="button">
          <span class="rank-pos">${medal || `#${q.rank}`}</span>
          <div class="rank-main">
            <div class="rank-name">${q.name} <span class="muted">${q.symbol}</span></div>
            <div class="rank-bar-track"><div class="rank-bar-fill ${dir}" style="width:${barPct.toFixed(1)}%"></div></div>
          </div>
          <span class="rank-value ${dir}">${sign}${Number(q.changePercent).toFixed(1)}%</span>
        </li>`;
    })
    .join('');

  list.querySelectorAll('.rank-row').forEach((row) => {
    row.addEventListener('click', () => openChart(row.dataset.symbol, row.dataset.name));
    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openChart(row.dataset.symbol, row.dataset.name);
      }
    });
  });
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
      const badge = item.catalyst
        ? `<span class="catalyst-badge">🧪 ${item.catalyst}</span>`
        : '';
      return `
        <li class="news-item${item.catalyst ? ' has-catalyst' : ''}">
          ${badge}
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
    .map((item, i) => {
      // Cliquable si on sait quoi ouvrir : le graphique de la valeur concernee,
      // sinon le lien de l'actualite (quand il y en a un reel, pas juste "/").
      const clickable = Boolean(item.symbol) || Boolean(item.url && item.url !== '/');
      return `
        <li class="history-item${clickable ? ' clickable' : ''}" data-index="${i}" ${clickable ? 'tabindex="0" role="button"' : ''}>
          <div class="title">${item.title}</div>
          <div class="body">${item.body || ''}</div>
          <div class="history-meta">${fmtDateTime(item.createdAt)}${item.sentPush ? '' : ' &middot; silencieux (ne pas deranger)'}</div>
        </li>`;
    })
    .join('');

  function activate(item) {
    if (item.symbol) {
      openChart(item.symbol, item.company || item.symbol);
    } else if (item.url && item.url !== '/') {
      window.open(item.url, '_blank', 'noopener');
    }
  }

  list.querySelectorAll('.history-item.clickable').forEach((li) => {
    const item = items[Number(li.dataset.index)];
    li.addEventListener('click', () => activate(item));
    li.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate(item);
      }
    });
  });
}

// ---------- Chart modal ----------
const chartState = { symbol: null, name: null, range: '6mo' };

const chartModal = document.getElementById('chart-modal');
const chartContainer = document.getElementById('chart-container');
const chartTitle = document.getElementById('chart-title');
const chartSubtitle = document.getElementById('chart-subtitle');

function closeChart() {
  chartModal.hidden = true;
  chartContainer.innerHTML = '';
}

document.getElementById('chart-close').addEventListener('click', closeChart);
chartModal.addEventListener('click', (e) => {
  if (e.target === chartModal) closeChart();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !chartModal.hidden) closeChart();
});

document.getElementById('chart-ranges').addEventListener('click', (e) => {
  const btn = e.target.closest('.range-btn');
  if (!btn) return;
  document.querySelectorAll('.range-btn').forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
  chartState.range = btn.dataset.range;
  loadChart();
});

async function openChart(symbol, name) {
  chartState.symbol = symbol;
  chartState.name = name;
  chartTitle.textContent = name;
  chartSubtitle.textContent = symbol;
  chartModal.hidden = false;
  await loadChart();
}

async function loadChart() {
  // Pas de placeholder "Chargement..." si un graphique est deja affiche (cas
  // du rafraichissement automatique) pour eviter un clignotement toutes les
  // 20s : le graphique existant reste visible jusqu'a l'arrivee des nouvelles
  // donnees.
  const hasChart = Boolean(chartContainer.querySelector('.chart-svg'));
  if (!hasChart) chartContainer.innerHTML = '<p class="muted">Chargement...</p>';
  try {
    const res = await fetch(api(`history?symbol=${encodeURIComponent(chartState.symbol)}&range=${chartState.range}`));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.points || data.points.length < 2) {
      chartContainer.innerHTML = '<p class="muted">Pas assez de donnees pour ce graphique.</p>';
      return;
    }
    renderLineChart(chartContainer, data.points, data.currency || '', Boolean(data.intraday));
  } catch (err) {
    if (!hasChart) chartContainer.innerHTML = `<p class="muted">Graphique indisponible (${err.message}).</p>`;
  }
}

// Moyenne mobile simple sur "window" points ; null tant qu'il n'y a pas assez
// d'historique. Repere descriptif de tendance, ce n'est ni un signal ni une
// prediction.
function simpleMovingAverage(closes, window) {
  return closes.map((_, i) => {
    if (i < window - 1) return null;
    let sum = 0;
    for (let j = i - window + 1; j <= i; j++) sum += closes[j];
    return sum / window;
  });
}

function renderLineChart(container, points, currency, intraday) {
  const width = 640;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const priceH = 180;
  const volGap = 14;
  const volH = 50;
  const padB = 28;
  const height = padT + priceH + volGap + volH + padB;
  const plotW = width - padL - padR;
  const plotH = priceH;
  const volTop = padT + priceH + volGap;

  const closes = points.map((p) => p.close);
  const volumes = points.map((p) => p.volume ?? 0);
  const hasVolume = volumes.some((v) => v > 0);
  const maxVol = Math.max(...volumes, 1);
  const avgVol = hasVolume ? volumes.reduce((a, b) => a + b, 0) / volumes.length : null;
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const dir = closes[closes.length - 1] >= closes[0] ? 'up' : 'down';
  const color = dir === 'up' ? 'var(--up)' : 'var(--down)';

  const MA_WINDOW = 20;
  const ma = simpleMovingAverage(closes, MA_WINDOW);
  const hasMA = ma.some((v) => v != null);

  const x = (i) => padL + (i / (points.length - 1)) * plotW;
  const y = (v) => padT + plotH - ((v - min) / range) * plotH;
  const volY = (v) => volTop + volH - (v / maxVol) * volH;
  const barW = Math.max(1, (plotW / points.length) * 0.7);

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(p.close).toFixed(1)}`).join(' ');

  const volBars = hasVolume
    ? points
        .map((p, i) => {
          const v = p.volume ?? 0;
          const barTop = volY(v);
          const barH = volTop + volH - barTop;
          return `<rect x="${(x(i) - barW / 2).toFixed(1)}" y="${barTop.toFixed(1)}" width="${barW.toFixed(1)}" height="${barH.toFixed(1)}" fill="var(--volume-bar)" />`;
        })
        .join('')
    : '';

  let maPath = '';
  if (hasMA) {
    let started = false;
    const segments = [];
    ma.forEach((v, i) => {
      if (v == null) return;
      segments.push(`${started ? 'L' : 'M'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`);
      started = true;
    });
    maPath = segments.join(' ');
  }

  const last = closes[closes.length - 1];
  const pctFromMin = ((last - min) / min) * 100;
  const pctFromMax = ((last - max) / max) * 100;

  const gridLines = [max, min]
    .map(
      (v) => `
      <line x1="${padL}" y1="${y(v).toFixed(1)}" x2="${width - padR}" y2="${y(v).toFixed(1)}" class="chart-grid" stroke-dasharray="2 4" />
      <text x="${padL - 8}" y="${y(v).toFixed(1)}" class="chart-axis-text" text-anchor="end" dominant-baseline="middle">${v.toFixed(2)}</text>`
    )
    .join('');

  const lastX = x(points.length - 1);
  const lastY = y(closes[closes.length - 1]);

  const dateLabel = intraday
    ? (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    : (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

  const volBottom = volTop + volH;

  const svg = `
    <svg viewBox="0 0 ${width} ${height}" class="chart-svg" role="img" aria-label="Historique du cours et du volume">
      ${gridLines}
      ${hasVolume ? `<text x="${padL - 8}" y="${volTop + 8}" class="chart-axis-text" text-anchor="end">${formatCompactNumber(maxVol)}</text>` : ''}
      ${hasVolume ? `<text x="${padL - 8}" y="${volBottom}" class="chart-axis-text" text-anchor="end">0</text>` : ''}
      <text x="${padL}" y="${height - 6}" class="chart-axis-text" text-anchor="start">${dateLabel(points[0].date)}</text>
      <text x="${width - padR}" y="${height - 6}" class="chart-axis-text" text-anchor="end">${dateLabel(points[points.length - 1].date)}</text>
      ${volBars}
      ${hasMA ? `<path d="${maPath}" fill="none" stroke="var(--ma-line)" stroke-width="2" stroke-dasharray="4 3" stroke-linejoin="round" stroke-linecap="round" />` : ''}
      <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
      <circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4" fill="${color}" stroke="var(--bg-elevated)" stroke-width="2" />
      <g id="chart-crosshair" style="display:none">
        <line id="chart-crosshair-line" x1="0" y1="${padT}" x2="0" y2="${volBottom}" class="chart-crosshair-line" />
        <circle id="chart-crosshair-dot" r="4" fill="${color}" stroke="var(--bg-elevated)" stroke-width="2" />
      </g>
      <rect x="${padL}" y="${padT}" width="${plotW}" height="${volBottom - padT}" fill="transparent" id="chart-hit-area" />
    </svg>
    <div id="chart-tooltip" class="chart-tooltip" hidden></div>
    <div class="chart-legend">
      <span class="legend-item"><span class="legend-swatch" style="background:${color}"></span>Cours de cloture</span>
      ${hasMA ? `<span class="legend-item"><span class="legend-swatch dashed"></span>Moyenne mobile (${MA_WINDOW}j)</span>` : ''}
      ${hasVolume ? `<span class="legend-item"><span class="legend-swatch" style="background:var(--volume-bar)"></span>Volume</span>` : ''}
    </div>
    <div class="chart-stats">
      <div class="chart-stat"><span class="muted">Plus haut (periode)</span><strong>${max.toFixed(2)} ${currency}</strong></div>
      <div class="chart-stat"><span class="muted">Plus bas (periode)</span><strong>${min.toFixed(2)} ${currency}</strong></div>
      <div class="chart-stat"><span class="muted">Cours actuel vs plus bas</span><strong class="up">+${pctFromMin.toFixed(1)}%</strong></div>
      <div class="chart-stat"><span class="muted">Cours actuel vs plus haut</span><strong class="down">${pctFromMax.toFixed(1)}%</strong></div>
      ${hasVolume ? `<div class="chart-stat"><span class="muted">Volume moyen (periode)</span><strong>${formatCompactNumber(Math.round(avgVol))}</strong></div>` : ''}
    </div>
    <p class="chart-disclaimer">Reperes informatifs (moyenne mobile, ecarts haut/bas, volume) &mdash; pas un signal d'achat, pas une prediction.</p>
  `;

  container.innerHTML = svg;

  const hitArea = container.querySelector('#chart-hit-area');
  const svgEl = container.querySelector('.chart-svg');
  const crosshair = container.querySelector('#chart-crosshair');
  const crosshairLine = container.querySelector('#chart-crosshair-line');
  const crosshairDot = container.querySelector('#chart-crosshair-dot');
  const tooltip = container.querySelector('#chart-tooltip');

  function pointerToIndex(clientX) {
    const rect = svgEl.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * width;
    const ratio = Math.min(1, Math.max(0, (relX - padL) / plotW));
    return Math.round(ratio * (points.length - 1));
  }

  function showAt(clientX, clientY) {
    const i = pointerToIndex(clientX);
    const p = points[i];
    const px = x(i);
    const py = y(p.close);
    crosshair.style.display = '';
    crosshairLine.setAttribute('x1', px.toFixed(1));
    crosshairLine.setAttribute('x2', px.toFixed(1));
    crosshairDot.setAttribute('cx', px.toFixed(1));
    crosshairDot.setAttribute('cy', py.toFixed(1));

    const containerRect = container.getBoundingClientRect();
    tooltip.hidden = false;
    const volText = p.volume != null ? ` · Vol ${formatCompactNumber(p.volume)}` : '';
    tooltip.textContent = `${dateLabel(p.date)} · ${p.close.toFixed(2)} ${currency}${volText}`;
    let left = clientX - containerRect.left + 12;
    if (left + 140 > containerRect.width) left = clientX - containerRect.left - 140;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${clientY - containerRect.top - 36}px`;
  }

  function hide() {
    crosshair.style.display = 'none';
    tooltip.hidden = true;
  }

  hitArea.addEventListener('pointermove', (e) => showAt(e.clientX, e.clientY));
  hitArea.addEventListener('pointerleave', hide);
  hitArea.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (t) showAt(t.clientX, t.clientY);
    },
    { passive: true }
  );
}

// ---------- Status ----------
async function loadStatus() {
  const res = await fetch(api('status'));
  const status = await res.json();
  document.getElementById('quotes-updated').textContent = fmtTime(status.lastPriceUpdate);
  document.getElementById('news-updated').textContent = fmtTime(status.lastNewsUpdate);
  document.getElementById('push-status').textContent = status.pushConfigured
    ? `Notifications configurees — ${status.subscriptionsCount} appareil(s) abonne(s). Cours verifies toutes les 2 min, actualites toutes les 5 min.`
    : 'Notifications non configurees cote serveur.';
}

// ---------- Settings ----------
async function loadSettings() {
  const res = await fetch(api('settings'));
  const s = await res.json();
  document.getElementById('move-up-percent').value = s.moveUpPercent;
  document.getElementById('move-up-percent-value').textContent = `+${s.moveUpPercent}%`;
  document.getElementById('move-down-percent').value = s.moveDownPercent;
  document.getElementById('move-down-percent-value').textContent = `-${s.moveDownPercent}%`;
  document.getElementById('sector-sante').checked = Boolean(s.sectors?.sante);
  document.getElementById('sector-energie').checked = Boolean(s.sectors?.energie);
  document.getElementById('news-alerts').checked = Boolean(s.newsAlerts);
  document.getElementById('quiet-start').value = s.quietHoursStart || '';
  document.getElementById('quiet-end').value = s.quietHoursEnd || '';
}

document.getElementById('move-up-percent').addEventListener('input', (e) => {
  document.getElementById('move-up-percent-value').textContent = `+${e.target.value}%`;
});
document.getElementById('move-down-percent').addEventListener('input', (e) => {
  document.getElementById('move-down-percent-value').textContent = `-${e.target.value}%`;
});

document.getElementById('quiet-clear').addEventListener('click', () => {
  document.getElementById('quiet-start').value = '';
  document.getElementById('quiet-end').value = '';
});

document.getElementById('save-settings').addEventListener('click', async () => {
  const payload = {
    moveUpPercent: parseFloat(document.getElementById('move-up-percent').value),
    moveDownPercent: parseFloat(document.getElementById('move-down-percent').value),
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
  const tasks = [loadQuotes(), loadNews(), loadHistory(), loadStatus()];
  if (!chartModal.hidden) tasks.push(loadChart());
  await Promise.all(tasks);
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

  // Le dashboard ne peut pas aller plus vite que les donnees elles-memes :
  // les cours viennent de pg_cron toutes les 2 min, les actualites toutes les
  // 5 min (voir supabase/migrations). Ce court interval sert juste a afficher
  // ces mises a jour des qu'elles arrivent, sans attendre une minute entiere.
  setInterval(refreshAll, 20_000);
}

init();
