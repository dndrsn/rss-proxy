/**
 * Example: Filter feed
 *
 * Fetches Hacker News RSS and keeps only items that mention
 * JavaScript, TypeScript, or Node in the title.
 */

export default {
  type: 'filter',

  source: 'https://news.ycombinator.com/rss',

  meta: {
    title: 'Hacker News – JS/TS/Node',
    description: 'HN stories mentioning JavaScript, TypeScript, or Node',
  },

  filter: (item) =>
    /javascript|typescript|node\.?js/i.test(item.title),

  // Optional: add a prefix to each title
  // transform: (item) => ({ ...item, title: `⚡ ${item.title}` }),

  limit: 20,
};
