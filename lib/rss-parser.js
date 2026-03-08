import { XMLParser } from 'fast-xml-parser';


const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  cdataPropName: '__cdata',
  textNodeName: '#text',
  isArray: (name) => name === 'item' || name === 'entry', // handle both RSS and Atom
});

/**
 * Fetches and parses an RSS/Atom feed URL.
 * Returns a normalized array of items and channel meta.
 */
export const fetchFeed = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch feed: ${res.status} ${res.statusText}`);
  const xml = await res.text();
  return parseFeed(xml);
};

export const parseFeed = (xml) => {
  const doc = parser.parse(xml);

  // RSS 2.0
  if (doc?.rss?.channel) {
    const ch = doc.rss.channel;
    const meta = {
      title: extractText(ch.title),
      link: extractText(ch.link),
      description: extractText(ch.description),
    };
    const items = (ch.item ?? []).map(normalizeRssItem);
    return { meta, items };
  }

  // Atom
  if (doc?.feed) {
    const feed = doc.feed;
    const meta = {
      title: extractText(feed.title),
      link: feed.link?.['@_href'] ?? extractText(feed.link),
      description: extractText(feed.subtitle),
    };
    const items = (feed.entry ?? []).map(normalizeAtomEntry);
    return { meta, items };
  }

  throw new Error('Unrecognized feed format');
};

const extractText = (val) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (val.__cdata) return val.__cdata;
  if (val['#text']) return val['#text'];
  return '';
};

const normalizeRssItem = (item) => ({
  title: extractText(item.title),
  link: extractText(item.link),
  description: extractText(item.description),
  pubDate: extractText(item.pubDate) || extractText(item['dc:date']) || null,
  guid: extractText(item.guid) || extractText(item.link),
  author: extractText(item.author) || extractText(item['dc:creator']) || null,
  category: extractText(item.category) || null,
  _raw: item,
});

const normalizeAtomEntry = (entry) => {
  const link =
    Array.isArray(entry.link)
      ? (entry.link.find((l) => l['@_rel'] === 'alternate') ?? entry.link[0])?.['@_href']
      : entry.link?.['@_href'] ?? extractText(entry.link);

  return {
    title: extractText(entry.title),
    link: link ?? '',
    description: extractText(entry.summary) || extractText(entry.content),
    pubDate: extractText(entry.published) || extractText(entry.updated) || null,
    guid: extractText(entry.id) || link,
    author: extractText(entry.author?.name) || null,
    category: entry.category?.['@_term'] || null,
    _raw: entry,
  };
};
