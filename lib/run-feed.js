import { buildRss } from './rss-builder.js';
import { fetchFeed } from './rss-parser.js';

/**
 * Executes a feed module and returns an RSS XML string.
 *
 * Feed module shapes:
 *
 * Filter mode — reads an existing feed, filters/transforms items:
 * {
 *   type: 'filter',
 *   source: string,                          // RSS/Atom URL to fetch
 *   meta?: Partial<{ title, link, description }>, // override channel meta
 *   filter?: (item, index) => boolean,       // return false to exclude
 *   transform?: (item, index) => item,       // reshape each item
 *   sort?: (a, b) => number,                 // custom sort
 *   limit?: number,                          // max items to return
 * }
 *
 * Scrape mode — fetches a web page, generates items from HTML:
 * {
 *   type: 'scrape',
 *   source: string,                          // page URL to fetch
 *   meta: { title, link, description },      // required channel meta
 *   scrape: (html: string, url: string) => Array<Item>, // returns items
 *   limit?: number,
 * }
 *
 * Item shape: { title, link, description?, pubDate?, guid?, author?, category? }
 */
export const runFeed = async (feedModule, { feedUrl } = {}) => {
  const mod = feedModule.default ?? feedModule;

  if (mod.type === 'filter') return runFilter(mod, feedUrl);
  if (mod.type === 'scrape') return runScrape(mod, feedUrl);

  throw new Error(`Unknown feed type: "${mod.type}". Expected "filter" or "scrape".`);
};

const runFilter = async (mod, feedUrl) => {
  const { meta: sourceMeta, items: sourceItems } = await fetchFeed(mod.source);

  let items = sourceItems;

  if (mod.filter) items = items.filter(mod.filter);
  if (mod.transform) items = items.map(mod.transform);
  if (mod.sort) items = [...items].sort(mod.sort);
  if (mod.limit) items = items.slice(0, mod.limit);

  const meta = {
    ...sourceMeta,
    ...mod.meta,
    ...(feedUrl ? { feedUrl } : {}),
  };

  return buildRss(meta, items);
};

const runScrape = async (mod, feedUrl) => {
  const res = await fetch(mod.source);
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status} ${res.statusText}`);
  const html = await res.text();

  let items = await mod.scrape(html, mod.source);

  if (mod.limit) items = items.slice(0, mod.limit);

  const meta = {
    link: mod.source,
    ...mod.meta,
    ...(feedUrl ? { feedUrl } : {}),
  };

  return buildRss(meta, items);
};
