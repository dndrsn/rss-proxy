# rss-proxy

A lightweight RSS proxy for Vercel. Filter existing feeds or scrape pages into new ones — each feed is a single JS file.

## Setup

```bash
pnpm install
```

## Creating a feed

Add a file to `feeds/`. The filename becomes the feed slug.

Each feed module exports an object with:

| Field     | Required | Description |
|-----------|----------|-------------|
| `meta`    | ✅       | Channel metadata (see below) |
| `sources` | ✅       | Array of `FilterSource` or `ScrapeSource` objects |
| `limit`   |          | Max total items across all sources after merging |

### meta

| Field         | Description |
|---------------|-------------|
| `title`       | Channel title |
| `description` | Channel description |
| `link`        | URL of the site the feed represents. Used as the clickable link on the feed title in RSS readers, and to locate the site's favicon. Defaults to the proxy's own URL. |
| `imageUrl`    | URL of the channel image/favicon shown in RSS readers. Defaults to `/favicon.ico` on the proxy's own domain. |

### Filter an existing RSS feed

```js
// feeds/my-feed.js
export default {
  meta: {
    title: 'My Feed',
    description: 'Filtered version',
  },

  sources: [
    {
      type: 'filter',
      url: 'https://example.com/feed.rss',
      filter: (item) => item.title.includes('JavaScript'), // optional
      transform: (item) => ({ ...item, title: `[JS] ${item.title}` }), // optional
      sort: (a, b) => new Date(b.pubDate) - new Date(a.pubDate), // optional
      limit: 20, // optional
    },
  ],
};
```

### Scrape a page into a feed

```js
// feeds/my-scrape.js
import { parse } from 'node-html-parser';

export default {
  meta: {
    title: 'Example Blog',
    description: 'Scraped feed',
    link: 'https://example.com/blog',
  },

  sources: [
    {
      type: 'scrape',
      url: 'https://example.com/blog',
      scrape: (html, sourceUrl) => {
        const root = parse(html);
        return root.querySelectorAll('article').map((el) => ({
          title: el.querySelector('h2')?.text?.trim(),
          link: el.querySelector('a')?.getAttribute('href'),
          description: el.querySelector('p')?.text?.trim(),
          pubDate: el.querySelector('time')?.getAttribute('datetime'),
        }));
      },
      limit: 25, // optional
    },
  ],
};
```

### Combining multiple sources

Multiple sources are merged, deduplicated by `title`+`link`, and sorted newest-first:

```js
export default {
  meta: {
    title: 'Combined Feed',
    description: 'Items from multiple sources',
  },

  limit: 30, // optional cap after merging

  sources: [
    { type: 'filter', url: 'https://example.com/feed-a.rss' },
    { type: 'filter', url: 'https://example.com/feed-b.rss' },
  ],
};
```

### Item shape

| Field         | Type              | Required |
|---------------|-------------------|----------|
| `title`       | string            | ✅       |
| `link`        | string            | ✅       |
| `description` | string            |          |
| `pubDate`     | string \| Date    |          |
| `guid`        | string            |          |
| `author`      | string            |          |
| `category`    | string            |          |

## Local dev

```bash
# Start HTTP server (mirrors Vercel routing)
pnpm dev
# → http://localhost:3030/api/feed/<slug>
```

The dev server index page at `http://localhost:3030` lists all available feeds.

## Deploy

```bash
vercel deploy
```

Feeds are served at:
```
https://<your-domain>/api/feed/<slug>
```

## Structure

```
/
├── api/feed/[slug].js   Vercel serverless handler
├── feeds/               Your feed files (one per feed)
├── lib/
│   ├── rss-builder.js   Builds RSS XML
│   ├── rss-parser.js    Fetches + parses RSS/Atom
│   └── run-feed.js      Orchestrates filter/scrape pipeline
├── dev.js               Local dev runner
└── vercel.json
```
