/**
 * Example: Filter feed
 *
 * Fetches Hacker News RSS and keeps only items that mention
 * JavaScript, TypeScript, or Node in the title.
 */

export default {
  meta: {
    title: 'Hacker News – JS/TS/Node',
    description: 'HN stories mentioning JavaScript, TypeScript, or Node',
  },

  limit: 20,

  sources: [
    {
      type: 'filter',
      url: 'https://news.ycombinator.com/rss',
      filter: (item) =>
        /javascript|typescript|node\.?js/i.test(item.title),
      // Optional: add a prefix to each title
      // transform: (item) => ({ ...item, title: `⚡ ${item.title}` }),
    },
  ],
};
