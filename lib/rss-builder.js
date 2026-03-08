/**
 * Builds an RSS 2.0 XML string from a feed definition and items.
 * @param {{ title: string, link: string, description: string, feedUrl?: string }} meta
 * @param {Array<{ title: string, link: string, description?: string, pubDate?: string|Date, guid?: string }>} items
 * @returns {string}
 */
export const buildRss = (meta, items) => {
  const esc = (str = '') =>
    String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const tag = (name, value, attrs = '') =>
    value != null ? `<${name}${attrs ? ' ' + attrs : ''}>${value}</${name}>` : '';

  const cdata = (str = '') => `<![CDATA[${str}]]>`;

  const itemXml = (item) => `
    <item>
      ${tag('title', cdata(item.title))}
      ${tag('link', esc(item.link))}
      ${tag('guid', esc(item.guid ?? item.link), 'isPermaLink="false"')}
      ${item.description != null ? tag('description', cdata(item.description)) : ''}
      ${item.pubDate != null ? tag('pubDate', new Date(item.pubDate).toUTCString()) : ''}
      ${item.author != null ? tag('author', esc(item.author)) : ''}
      ${item.category != null ? tag('category', esc(item.category)) : ''}
    </item>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    ${tag('title', cdata(meta.title))}
    ${tag('link', esc(meta.link))}
    ${tag('description', cdata(meta.description))}
    ${meta.feedUrl ? `<atom:link href="${esc(meta.feedUrl)}" rel="self" type="application/rss+xml"/>` : ''}
    ${meta.imageUrl ? `<image><url>${esc(meta.imageUrl)}</url><title>${esc(meta.title ?? '')}</title><link>${esc(meta.link ?? '')}</link></image>` : ''}
    ${tag('lastBuildDate', new Date().toUTCString())}
    ${tag('generator', 'rss-proxy')}
    ${items.map(itemXml).join('\n')}
  </channel>
</rss>`;
};
