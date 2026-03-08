#!/usr/bin/env node

/**
 * Local dev runner for rss-proxy feeds.
 *
 * CLI mode (print XML to stdout):
 *   node dev.js <feed-slug>
 *   node dev.js my-blog
 *
 * HTTP server mode (mirrors Vercel routing):
 *   node dev.js --serve [--port 3000]
 *   Then visit: http://localhost:3000/api/feed/<slug>
 */

import { readdir } from 'fs/promises';
import { createServer } from 'http';

import { runFeed } from './lib/run-feed.js';


const args = process.argv.slice(2);
const serveMode = args.includes('--serve');
const portArg = args[args.indexOf('--port') + 1];
const PORT = portArg ? parseInt(portArg) : 3000;

// ── HTTP server mode ────────────────────────────────────────────────────────

if (serveMode) {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const match = url.pathname.match(/^\/api\/feed\/([\w-]+)$/);

    if (url.pathname === '/') {
      return listFeeds(res);
    }

    if (!match) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not found. Try /api/feed/<slug>');
    }

    const slug = match[1];
    let feedModule;

    try {
      // Bust import cache for hot-ish reloading during dev
      feedModule = await import(`./feeds/${slug}.js?t=${Date.now()}`);
    }
    catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end(`Feed not found: ${slug}`);
    }

    try {
      const feedUrl = `http://localhost:${PORT}/api/feed/${slug}`;
      const xml = await runFeed(feedModule, { feedUrl });
      res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
      res.end(xml);
    }
    catch (err) {
      console.error(`[error] Feed "${slug}":`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Feed error: ${err.message}`);
    }
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 rss-proxy dev server running at http://localhost:${PORT}`);
    console.log(`   Feed endpoint: http://localhost:${PORT}/api/feed/<slug>\n`);
  });
}

// ── CLI mode ────────────────────────────────────────────────────────────────

else {
  const slug = args.find((a) => !a.startsWith('--'));

  if (!slug) {
    console.log('Usage: node dev.js <feed-slug>\n       node dev.js --serve [--port 3000]\n');
    listFeedsCli();
  }
  else {
    runCli(slug);
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const runCli = async (slug) => {
  let feedModule;
  try {
    feedModule = await import(`./feeds/${slug}.js`);
  }
  catch {
    console.error(`❌ Feed not found: feeds/${slug}.js`);
    process.exit(1);
  }

  try {
    const xml = await runFeed(feedModule, { feedUrl: `http://localhost/api/feed/${slug}` });
    process.stdout.write(xml + '\n');
  }
  catch (err) {
    console.error(`❌ Feed error:`, err);
    process.exit(1);
  }
};

const getFeedSlugs = async () => {
  try {
    const files = await readdir('./feeds');
    return files.filter((f) => f.endsWith('.js')).map((f) => f.replace('.js', ''));
  }
  catch {
    return [];
  }
};

const listFeedsCli = async () => {
  const slugs = await getFeedSlugs();
  if (slugs.length === 0) {
    console.log('No feeds found in ./feeds/');
  }
  else {
    console.log('Available feeds:');
    slugs.forEach((s) => console.log(`  • ${s}  →  node dev.js ${s}`));
  }
};

const listFeeds = async (res) => {
  const slugs = await getFeedSlugs();
  const links = slugs.map((s) => `  <li><a href="/api/feed/${s}">/api/feed/${s}</a></li>`).join('\n');
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`<!doctype html><html><body>
    <h2>rss-proxy dev server</h2>
    <ul>${links || '<li>No feeds found in ./feeds/</li>'}</ul>
  </body></html>`);
};
