// Agregation d'actualites via les flux RSS "Google News", sans dependance
// externe : un petit extracteur regex suffit pour ce format XML simple.

import type { Stock } from "./watchlist.ts";
import { detectCatalyst } from "./catalysts.ts";

const GOOGLE_NEWS_RSS = (query: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=fr&gl=FR&ceid=FR:fr`;

const SECTOR_QUERIES: Record<string, string> = {
  sante: "biotech OR pharma bourse Euronext Paris",
  energie: "energie renouvelable OR hydrogene bourse Euronext Paris",
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

async function fetchFeed(query: string, meta: Partial<NewsItem>): Promise<NewsItem[]> {
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
    return items.map(([, block]) => {
      const link = extractTag(block, "link") || "";
      const title = extractTag(block, "title") || "(sans titre)";
      const catalyst = detectCatalyst(title);
      return {
        id: link,
        title,
        link,
        pubDate: extractTag(block, "pubDate"),
        source: extractTag(block, "source") || "Google News",
        symbol: meta.symbol ?? null,
        company: meta.company ?? null,
        sector: meta.sector ?? null,
        scope: meta.scope!,
        catalyst: catalyst?.label ?? null,
      };
    });
  } catch (err) {
    console.error(`[news] echec flux "${query}":`, (err as Error).message);
    return [];
  }
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
  const companyJobs = watchlist.map((stock) => ({
    query: `"${stock.name}" bourse`,
    meta: { symbol: stock.symbol, company: stock.name, sector: stock.sector, scope: "company" as const },
  }));
  const sectorJobs = Object.entries(SECTOR_QUERIES).map(([sector, query]) => ({
    query,
    meta: { symbol: null, company: null, sector, scope: "sector" as const },
  }));

  const allJobs = [...companyJobs, ...sectorJobs];
  const items = await mapWithConcurrency(allJobs, 2, (job) => fetchFeed(job.query, job.meta));

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
