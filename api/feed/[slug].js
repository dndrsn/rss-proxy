import { runFeed } from '../../lib/run-feed.js';


export default async function handler(req, res) {
  const { slug } = req.query;

  // Sanitize slug — only allow alphanumeric, hyphens, underscores
  if (!/^[\w-]+$/.test(slug)) {
    res.status(400).send('Invalid feed name');
    return;
  }

  let feedModule;
  try {
    feedModule = await import(`../../feeds/${slug}.js`);
  }
  catch (err) {
    if (err.code === 'ERR_MODULE_NOT_FOUND') {
      res.status(404).send(`Feed not found: ${slug}`);
    }
    else {
      console.error(`[rss-proxy] Error loading feed "${slug}":`, err);
      res.status(500).send(`Feed load error: ${err.message}`);
    }
    return;
  }

  try {
    const feedUrl = `https://${req.headers.host}/api/feed/${slug}`;
    const siteUrl = `https://${req.headers.host}`;
    const xml = await runFeed(feedModule, { feedUrl, siteUrl });
    res.setHeader('Content-Type', 'application/rss+xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
    res.status(200).send(xml);
  }
  catch (err) {
    console.error(`[rss-proxy] Error running feed "${slug}":`, err);
    res.status(500).send(`Feed error: ${err.message}`);
  }
}
