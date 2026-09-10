// Agregation d'actualites via les flux RSS "Google News", sans dependance
// externe : un petit extracteur regex suffit pour ce format XML simple.

import type { Stock } from "./watchlist.ts";
import { detectCatalyst } from "./catalysts.ts";

const GOOGLE_NEWS_RSS = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;

const SECTOR_QUERIES: Record<string, string> = {
  sante: "biotech OR pharma bourse Euronext Paris",
  energie: "energie renouvelable OR hydrogene bourse Euronext Paris",
  finance: "banque OR assurance resultats bourse Euronext Paris",
  technologie: "technologie OR semi-conducteurs bourse Euronext Paris",
  consommation: "consommation OR luxe OR distribution bourse Euronext Paris",
  industrie: "industrie OR aeronautique bourse Euronext Paris",
  telecom: "telecom bourse Euronext Paris",
  immobilier: "immobilier cote bourse Euronext Paris",
  automobile: "automobile equipementier bourse Euronext Paris",
};

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string | null;
  source: string;
  symbol: string | null;
  company: string | null;
  sector: string | null;
  scope: "company" | "sector";
  catalyst: string | null;
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&amp;/g, "&");
}

function extractTag(block: string, tag: string): string | null {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  if (!match) return null;
  const raw = match[1].trim();
  const cdata = raw.match(/^<!\[CDATA\[([\s\S]*)\]\]>$/);
  return decodeEntities(cdata ? cdata[1] : raw);
}

async function fetchRssItems(query: string): Promise<{ block: string; link: string; title: string; pubDate: string | null; source: string }[]> {
  try {
    const res = await fetch(GOOGLE_NEWS_RSS(query), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 8);
    return items.map(([, block]) => ({
      block,
      link: extractTag(block, "link") || "",
      title: extractTag(block, "title") || "(sans titre)",
      pubDate: extractTag(block, "pubDate"),
      source: extractTag(block, "source") || "Google News",
    }));
  } catch (err) {
    console.error(`[news] echec flux "${query}":`, (err as Error).message);
    return [];
  }
}

function toItem(
  raw: { link: string; title: string; pubDate: string | null; source: string },
  meta: Partial<NewsItem>
): NewsItem {
  const catalyst = detectCatalyst(raw.title);
  return {
    id: raw.link,
    title: raw.title,
    link: raw.link,
    pubDate: raw.pubDate,
    source: raw.source,
    symbol: meta.symbol ?? null,
    company: meta.company ?? null,
    sector: meta.sector ?? null,
    scope: meta.scope!,
    catalyst: catalyst?.label ?? null,
  };
}

// Repartit une liste en sous-listes d'au plus "size" elements.
function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Pour ne pas faire une requete Google News par entreprise (le flux devient
// trop volumineux avec une watchlist elargie et risque de re-declencher les
// blocages anti-bot deja rencontres), on regroupe plusieurs entreprises du
// meme secteur dans une seule requete "OR", puis on retrouve apres coup a
// quelle entreprise du lot chaque article appartient en cherchant son nom
// dans le titre (le plus long nom correspondant l'emporte, pour eviter les
// faux positifs entre noms courts inclus dans des noms plus longs).
function matchCompanyInBatch(title: string, batch: Stock[]): Stock | null {
  const lower = title.toLowerCase();
  let best: Stock | null = null;
  for (const stock of batch) {
    if (lower.includes(stock.name.toLowerCase())) {
      if (!best || stock.name.length > best.name.length) best = stock;
    }
  }
  return best;
}

const BATCH_SIZE = 7;

async function fetchCompanyBatch(batch: Stock[], sector: string): Promise<NewsItem[]> {
  const query = `${batch.map((s) => `"${s.name}"`).join(" OR ")} bourse`;
  const raws = await fetchRssItems(query);
  return raws.map((raw) => {
    const stock = matchCompanyInBatch(raw.title, batch);
    return toItem(raw, {
      symbol: stock?.symbol ?? null,
      company: stock?.name ?? null,
      sector,
      scope: stock ? "company" : "sector",
    });
  });
}

async function mapWithConcurrency<T>(items: T[], limit: number, fn: (item: T) => Promise<NewsItem[]>) {
  const results: NewsItem[] = [];
  let index = 0;
  async function worker() {
    while (index < items.length) {
      const current = index++;
      results.push(...(await fn(items[current])));
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export async function fetchAllNews(watchlist: Stock[]): Promise<NewsItem[]> {
  const bySector: Record<string, Stock[]> = {};
  for (const stock of watchlist) (bySector[stock.sector] ||= []).push(stock);

  const companyBatchJobs = Object.entries(bySector).flatMap(([sector, stocks]) =>
    chunk(stocks, BATCH_SIZE).map((batch) => ({ batch, sector }))
  );
  const sectorJobs = Object.entries(SECTOR_QUERIES).map(([sector, query]) => ({ query, sector }));

  const items = await mapWithConcurrency(
    [
      ...companyBatchJobs.map((job) => () => fetchCompanyBatch(job.batch, job.sector)),
      ...sectorJobs.map(
        (job) => () =>
          fetchRssItems(job.query).then((raws) =>
            raws.map((raw) => toItem(raw, { symbol: null, company: null, sector: job.sector, scope: "sector" }))
          )
      ),
    ],
    2,
    (job) => job()
  );

  const seen = new Set<string>();
  const unique: NewsItem[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  unique.sort((a, b) => new Date(b.pubDate || 0).getTime() - new Date(a.pubDate || 0).getTime());
  return unique;
}
