

const feedUrls = [
  'https://feeds.content.dowjones.io/public/rss/RSSUSnews',
  'https://feeds.content.dowjones.io/public/rss/WSJcomUSBusiness',
  'https://feeds.content.dowjones.io/public/rss/RSSWorldNews',
];


export default {

  meta: {
    title: 'WSJ - Deopinionated News',
    description: 'Wall Street Journal News feeds with no opinion posts',
    link: 'https://www.wsj.com/',
  },

  sources: feedUrls.map(url => (
    {
      url,
      type: 'filter',
      filter: (item) => !/^Opinion\s/i.test(item.title),
    }
  )),
};
