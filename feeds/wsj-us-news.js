
export default {
  type: 'filter',

  source: 'https://feeds.content.dowjones.io/public/rss/RSSUSnews',

  meta: {
    title: 'WSJ - US News Unopinionated',
    description: 'Wall Street Journal US News with no opinion posts',
  },

  filter: (item) => !/^Opinion\s/i.test(item.title),
};
