/**
 * Example: Scrape feed
 *
 * Scrapes the Vercel blog index page and generates an RSS feed.
 * Uses node-html-parser to extract article data from the HTML.
 *
 * Note: site structures change — treat this as a template,
 * you'll likely need to adjust the selectors for your target.
 */

import { parse } from 'node-html-parser';


export default {
  type: 'scrape',

  source: 'https://vercel.com/blog',

  meta: {
    title: 'Vercel Blog (scraped)',
    description: 'Latest posts from the Vercel blog',
    link: 'https://vercel.com/blog',
  },

  scrape: (html, sourceUrl) => {
    const root = parse(html);
    const base = new URL(sourceUrl).origin;

    // Adjust selectors to match the target site's markup
    return root
      .querySelectorAll('a[href^="/blog/"]')
      .filter((el) => el.querySelector('h2, h3'))
      .map((el) => {
        const href = el.getAttribute('href');
        const link = href.startsWith('http') ? href : `${base}${href}`;
        const titleEl = el.querySelector('h2, h3');
        const descEl = el.querySelector('p');

        return {
          title: titleEl?.text?.trim() ?? link,
          link,
          description: descEl?.text?.trim() ?? '',
          guid: link,
          // pubDate is not always available in scraped HTML —
          // look for a <time> element or date text if needed:
          // pubDate: el.querySelector('time')?.getAttribute('datetime'),
        };
      })
      .filter((item) => item.title && item.link);
  },

  limit: 25,
};
