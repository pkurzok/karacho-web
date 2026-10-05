// Verifies the build output in dist/ against the URL contract of the site.
// Run through `npm run check`; uses Node built-ins only.
import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const dist = 'dist';
const imageSource = 'src/assets/images';
const sizeLimit = 25 * 1024 * 1024; // Cloudflare Pages rejects larger files.

const badgeFiles = { preorder: 'app-store-preorder', released: 'app-store-download' };
const badges = Object.values(badgeFiles).flatMap((badge) => ['black', 'white'].map((tone) => `${badge}-${tone}.svg`));

const siteData = await readFile('src/data/site.ts', 'utf8');
const status = siteData.match(/^\s*status:\s*'(\w+)'/m)?.[1];
const heroCtaLabel = siteData.match(/heroCta:\s*\{\s*label:\s*'([^']*)'/)?.[1];
const downloadCtaLabel = siteData.match(/downloadCta:\s*\{\s*label:\s*'([^']*)'/)?.[1];
const appStoreId = siteData.match(/^\s*appStoreId:\s*'([^']*)'/m)?.[1];
const appStoreUrl = siteData.match(/^\s*appStoreUrl:\s*'([^']*)'/m)?.[1];
// The entries of `screenshots` are the only ones with a `file:` key ending in .jpg.
const listedScreenshots = [...siteData.matchAll(/^\s*file:\s*'([^']+\.jpg)'/gm)].map(([, file]) => file).sort();
const screenshotFiles = (await readdir(path.join(imageSource, 'screenshots')))
  .filter((file) => file.endsWith('.jpg'))
  .sort();

const site = 'https://karacho.peterkurzok.de';
const sitemapUrls = ['/', '/privacy/'].map((page) => site + page);

const expectedFiles = [
  'index.html',
  'privacy/index.html',
  '404.html',
  'feed.rss',
  'sitemap.xml',
  'robots.txt',
  'images/app-icon.png',
  ...screenshotFiles.map((file) => `images/screenshots/${file}`),
  ...badges.map((file) => `images/${file}`),
];

let failures = 0;
const pass = (message) => console.log(`✓ ${message}`);
const fail = (message) => {
  failures += 1;
  console.log(`✗ ${message}`);
};
const check = (ok, message, problem = '') => (ok ? pass(message) : fail(`${message}   ${problem}`.trimEnd()));

const walk = async (directory) => {
  const entries = await readdir(directory, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(directory, path.join(entry.parentPath, entry.name)));
};

if (!existsSync(dist)) {
  console.log(`✗ ${dist}/ does not exist; run the build first`);
  process.exit(1);
}

const files = await walk(dist);
const read = (file) => readFile(path.join(dist, file), 'utf8');

// Expected files
for (const file of expectedFiles) {
  check(files.includes(file), `${dist}/${file}`, 'missing');
}

// Images are published unchanged
for (const file of files.filter((file) => file.startsWith('images/'))) {
  const source = path.join(imageSource, file.slice('images/'.length));
  const identical =
    existsSync(source) && (await readFile(source)).equals(await readFile(path.join(dist, file)));
  check(identical, `${dist}/${file} (identical to source)`, existsSync(source) ? 'differs' : 'has no source');
}

// Every screenshot file is listed in src/data/site.ts, and every entry has its file
check(
  screenshotFiles.length > 0 && screenshotFiles.join() === listedScreenshots.join(),
  `${screenshotFiles.length} screenshot files match the entries of "screenshots" in src/data/site.ts`,
  `files: ${screenshotFiles.join(', ') || 'none'}; entries: ${listedScreenshots.join(', ') || 'none'}`,
);

// Redirects: the site has none. Cloudflare Pages itself answers /privacy and /index.html with
// a 308 to the form with a trailing slash; a rule here would be a second mechanism.
const redirects = existsSync(path.join(dist, '_redirects'))
  ? (await read('_redirects'))
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
  : [];
check(redirects.length === 0, '_redirects holds 0 rules', `found ${redirects.length}`);

// Internal links
const htmlFiles = files.filter((file) => file.endsWith('.html'));
const html = new Map(await Promise.all(htmlFiles.map(async (file) => [file, await read(file)])));
const pageFor = (pathname) => path.join(pathname, pathname.endsWith('/') ? 'index.html' : '').replace(/^\//, '');

let links = 0;
const linkProblems = [];
for (const [file, content] of html) {
  for (const [, , target] of content.matchAll(/\s(href|src|data-full)="([^"]*)"/g)) {
    if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(target)) continue; // external
    links += 1;
    const [pathname, fragment] = target.split('?')[0].split('#');
    if (pathname && !pathname.startsWith('/')) {
      linkProblems.push(`${file}: "${target}" is not root-relative`);
      continue;
    }
    const page = pathname ? pageFor(pathname) : file;
    if (!files.includes(page)) {
      const isPage = !path.extname(pathname) && files.includes(pageFor(`${pathname}/`));
      linkProblems.push(
        isPage ? `${file}: "${target}" must end with "/"` : `${file}: "${target}" does not resolve`,
      );
      continue;
    }
    if (fragment && !html.get(page)?.includes(`id="${fragment}"`)) {
      linkProblems.push(`${file}: "${target}" points at a missing id`);
    }
  }
}
linkProblems.forEach(fail);
if (linkProblems.length === 0) pass(`${links} internal links resolve`);

// File size
const sizes = await Promise.all(files.map(async (file) => (await stat(path.join(dist, file))).size));
const largest = Math.max(...sizes);
check(
  largest <= sizeLimit,
  `largest file ${(largest / 1024 / 1024).toFixed(1)} MiB (limit 25 MiB)`,
  files[sizes.indexOf(largest)],
);

// Homepage: the calls to action follow app.status
const index = html.get('index.html') ?? '';
const anyBadge = badges.some((file) => index.includes(`/images/${file}`));
if (status === 'announced') {
  check(
    Boolean(heroCtaLabel) && index.includes(heroCtaLabel) && index.includes(downloadCtaLabel) && !anyBadge,
    `index.html shows the call to action for status "${status}"`,
    anyBadge ? 'an App Store badge is shown' : 'the buttons of heroCta and downloadCta are missing',
  );
} else {
  const badge = badgeFiles[status];
  const others = badges.filter((file) => !file.startsWith(`${badge}-`));
  let problem;
  if (!badge) problem = 'unknown status in src/data/site.ts';
  else if (!index.includes(`/images/${badge}-white.svg`)) problem = `${badge}-white.svg not referenced`;
  else if (others.some((file) => index.includes(`/images/${file}`))) problem = 'the badge of another status is shown';
  else if (index.includes(downloadCtaLabel)) problem = `"${downloadCtaLabel}" is still shown`;
  check(!problem, `index.html shows the badge for status "${status}"`, problem);
}
for (const id of ['screenshots', 'features', 'support', 'download']) {
  check(index.includes(`id="${id}"`), `index.html has id "${id}"`, 'missing');
}
for (const arrow of ['carousel-prev', 'carousel-next']) {
  check(
    new RegExp(`<button[^>]*class="carousel-arrow ${arrow}"`).test(index),
    `index.html has the ${arrow} button`,
    'missing',
  );
}
check(!/<script[^>]+src=/.test(index), 'index.html loads no script file', 'found <script src=…>');

// The Smart App Banner and the link preview
const hasBanner = index.includes('<meta name="apple-itunes-app"');
check(
  hasBanner === Boolean(appStoreId),
  `index.html ${appStoreId ? 'has' : 'omits'} the Smart App Banner tag`,
  hasBanner ? 'the tag is written without an App Store id' : 'appStoreId is set but the tag is missing',
);
const socialImage = index.match(/<meta property="og:image" content="([^"]*)"/)?.[1] ?? '';
check(
  socialImage.startsWith(`${site}/`) && files.includes(socialImage.slice(site.length + 1)),
  'the og:image of index.html exists in the build',
  `"${socialImage}" does not`,
);
if (status !== 'announced') {
  check(Boolean(appStoreId && appStoreUrl), `status "${status}" has appStoreId and appStoreUrl`, 'one of them is empty');
}

// Sitemap and feed
const sitemap = files.includes('sitemap.xml') ? await read('sitemap.xml') : '';
const locations = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, location]) => location);
check(
  locations.length === sitemapUrls.length && sitemapUrls.every((url) => locations.includes(url)),
  `sitemap.xml lists exactly ${sitemapUrls.length} URLs`,
  `found ${locations.join(', ') || 'none'}`,
);
const feed = files.includes('feed.rss') ? await read('feed.rss') : '';
check(feed.includes(`<atom:link href="${site}/feed.rss"`), 'feed.rss links to itself', 'atom:link missing');

// Privacy policy
const privacy = html.get('privacy/index.html') ?? '';
check(
  privacy.includes(`<link rel="canonical" href="${site}/privacy/"`),
  'privacy/index.html has its canonical URL',
  'missing',
);
check(
  privacy.includes('Last updated: 5 October 2026'),
  'privacy/index.html carries its "Last updated" date',
  'adjust this check when the policy changes',
);
for (const anchor of ['/#features', '/#support', '/#download']) {
  check(privacy.includes(`href="${anchor}"`), `privacy/index.html navigation links to ${anchor}`, 'missing');
}

if (failures > 0) {
  console.log(`${failures} ${failures === 1 ? 'check' : 'checks'} failed.`);
  process.exit(1);
}
console.log('All checks passed.');
