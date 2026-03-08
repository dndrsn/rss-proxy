import { buildRss } from './rss-builder.js';
import { fetchFeed } from './rss-parser.js';

/**
 * Executes a feed module and returns an RSS XML string.
 *
 * Feed module shape:
 * {
 *   meta: { title, link, description },      // required channel meta
 *   limit?: number,                          // max items after merge
 *   sources: Array<FilterSource | ScrapeSource>,
 * }
 *
 * FilterSource — reads an existing feed, filters/transforms items:
 * {
 *   type: 'filter',
 *   url: string,                             // RSS/Atom URL to fetch
 *   filter?: (item, index) => boolean,       // return false to exclude
 *   transform?: (item, index) => item,       // reshape each item
 *   sort?: (a, b) => number,                 // custom sort
 *   limit?: number,                          // max items from this source
 * }
 *
 * ScrapeSource — fetches a web page, generates items from HTML:
 * {
 *   type: 'scrape',
 *   url: string,                             // page URL to fetch
 *   scrape: (html: string, url: string) => Array<Item>,
 *   limit?: number,                          // max items from this source
 * }
 *
 * Item shape: { title, link, description?, pubDate?, guid?, author?, category? }
 */
export const runFeed = async (feedModule, { feedUrl, siteUrl } = {}) => {
  const mod = feedModule.default ?? feedModule;

  if (!mod.sources) throw new Error('Feed module must export a "sources" array.');

  return runMulti(mod, feedUrl, siteUrl);
};

const runMulti = async (mod, feedUrl, siteUrl) => {
  const results = await Promise.all(mod.sources.map(runSource));

  // Sort newest first so that dedup keeps the newest occurrence
  let items = results.flat().sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate) : null;
    const db = b.pubDate ? new Date(b.pubDate) : null;
    if (da && db) return db - da;
    if (da) return -1;
    if (db) return 1;
    return 0;
  });

  // Dedupe by title+link — newest-first order means first-seen = newest wins
  const seen = new Set();
  items = items.filter(item => {
    const key = `${item.title}\0${item.link}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (mod.limit) items = items.slice(0, mod.limit);

  const meta = {
    link: siteUrl,
    iconUrl: siteUrl ? `${siteUrl}/favicon.ico` : undefined,
    ...mod.meta,
    ...(feedUrl ? { feedUrl } : {}),
  };

  return buildRss(meta, items);
};

const runSource = source => {
  if (source.type === 'filter') return runFilterSource(source);
  if (source.type === 'scrape') return runScrapeSource(source);
  throw new Error(`Unknown source type: "${source.type}". Expected "filter" or "scrape".`);
};

const runFilterSource = async source => {
  const { items: sourceItems } = await fetchFeed(source.url);

  let items = sourceItems;

  if (source.filter) items = items.filter(source.filter);
  if (source.transform) items = items.map(source.transform);
  if (source.sort) items = [...items].sort(source.sort);
  if (source.limit) items = items.slice(0, source.limit);

  return items;
};

const runScrapeSource = async source => {
  const res = await fetch(source.url);
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status} ${res.statusText}`);
  const html = await res.text();

  let items = await source.scrape(html, source.url);

  if (source.limit) items = items.slice(0, source.limit);

  return items;
};
