'use strict';

const Parser = require('rss-parser');
const parser = new Parser({ timeout: 10000 });

const GOOGLE_NEWS_RSS = (query) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;

// Flux sectoriels generalistes, en plus des flux par societe
const SECTOR_QUERIES = {
  sante: 'biotech OR pharma bourse Euronext Paris',
  energie: 'energie renouvelable OR hydrogene bourse Euronext Paris',
};

function itemId(item) {
  return item.link || item.guid || `${item.title}-${item.pubDate}`;
}

async function fetchFeed(query, meta) {
  try {
    const feed = await parser.parseURL(GOOGLE_NEWS_RSS(query));
    return (feed.items || []).slice(0, 8).map((item) => ({
      id: itemId(item),
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      source: item.creator || item?.source || 'Google News',
      ...meta,
    }));
  } catch (err) {
    console.error(`[news] echec flux "${query}":`, err.message);
    return [];
  }
}

async function mapWithConcurrency(items, limit, fn) {
  const results = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      const r = await fn(items[current]);
      results.push(...r);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
}

async function fetchAllNews(watchlist) {
  const companyJobs = watchlist.map((stock) => ({
    query: `"${stock.name}" bourse`,
    meta: { symbol: stock.symbol, company: stock.name, sector: stock.sector, scope: 'company' },
  }));

  const sectorJobs = Object.entries(SECTOR_QUERIES).map(([sector, query]) => ({
    query,
    meta: { symbol: null, company: null, sector, scope: 'sector' },
  }));

  const allJobs = [...companyJobs, ...sectorJobs];
  const items = await mapWithConcurrency(allJobs, 4, (job) => fetchFeed(job.query, job.meta));

  // dedup par id, tri par date decroissante
  const seen = new Set();
  const unique = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  unique.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return unique;
}

module.exports = { fetchAllNews };
