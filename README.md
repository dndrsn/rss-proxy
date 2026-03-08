# rss-proxy

A lightweight RSS proxy for Vercel. Filter existing feeds or scrape pages into new ones — each feed is a single JS file.

## Setup

```bash
pnpm install
```

## Creating a feed

Add a file to `feeds/`. The filename becomes the feed slug.

### Filter an existing RSS feed

```js
// feeds/my-feed.js
export default {
  type: 'filter',
  source: 'https://example.com/feed.rss',

  meta: {               // optional — overrides source feed metadata
    title: 'My Feed',
    description: 'Filtered version',
  },

  filter: (item) => item.title.includes('JavaScript'),
  transform: (item) => ({ ...item, title: `[JS] ${item.title}` }), // optional
  sort: (a, b) => new Date(b.pubDate) - new Date(a.pubDate),        // optional
  limit: 20,            // optional
};
```

### Scrape a page into a feed

```js
// feeds/my-scrape.js
import { parse } from 'node-html-parser';

export default {
  type: 'scrape',
  source: 'https://example.com/blog',

  meta: {               // required
    title: 'Example Blog',
    description: 'Scraped feed',
    link: 'https://example.com/blog',
  },

  scrape: (html, sourceUrl) => {
    const root = parse(html);
    return root.querySelectorAll('article').map((el) => ({
      title: el.querySelector('h2')?.text?.trim(),
      link: el.querySelector('a')?.getAttribute('href'),
      description: el.querySelector('p')?.text?.trim(),
      pubDate: el.querySelector('time')?.getAttribute('datetime'),
    }));
  },

  limit: 25,            // optional
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
npm run dev
# → http://localhost:3000/api/feed/<slug>

# Print XML for a single feed to stdout
node dev.js <slug>
node dev.js hn-js
```

The dev server index page at `http://localhost:3000` lists all available feeds.

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
