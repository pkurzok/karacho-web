// Verifies the URL contract of a deployed site.
// Usage: npm run check:live -- https://karacho.peterkurzok.de
// Uses Node built-ins only; run it from the repository root, it compares files with
// src/assets/images.
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.argv[2]?.replace(/\/$/, '');
if (!base) {
  console.log('Usage: npm run check:live -- <base-url>');
  process.exit(1);
}

const imageSource = 'src/assets/images';

let checks = 0;
let failures = 0;
const report = (ok, label, problem) => {
  checks += 1;
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    failures += 1;
    console.log(`✗ ${label}   ${problem}`);
  }
};

const get = (pathname) => fetch(base + pathname, { redirect: 'manual' });

try {
  await get('/');
} catch (error) {
  console.log(`✗ ${base} is not reachable: ${error.cause?.message ?? error.message}`);
  process.exit(1);
}

// Answers with `status`; `contentType` and `body` are optional further expectations.
const expectStatus = async (status, pathname, { contentType, body } = {}) => {
  const response = await get(pathname);
  const type = response.headers.get('content-type') ?? '';
  let problem;
  if (response.status !== status) {
    problem = `expected ${status}, got ${response.status}`;
  } else if (contentType && !type.startsWith(contentType)) {
    problem = `expected ${contentType}, got ${type}`;
  } else if (body && !Buffer.from(await response.arrayBuffer()).equals(body)) {
    problem = 'differs from the source file';
  }
  const details = [contentType, body && 'identical to source'].filter(Boolean).join(', ');
  report(!problem, `${status} ${pathname}${details ? ` (${details})` : ''}`, problem);
  return response;
};

// Redirects with `status` to `target`, a path on the site or an absolute URL.
const expectRedirect = async (status, pathname, target) => {
  const response = await get(pathname);
  const location = response.headers.get('location');
  const resolved = location ? new URL(location, base).href : 'no location';
  const expected = new URL(target, base).href;
  let problem;
  if (response.status !== status) {
    problem = `expected ${status}, got ${response.status}`;
  } else if (resolved !== expected) {
    problem = `expected ${expected}, got ${resolved}`;
  }
  report(!problem, `${status} ${pathname} -> ${target}`, problem);
};

// Pages
for (const page of ['/', '/privacy/']) {
  await expectStatus(200, page, { contentType: 'text/html' });
}
const privacy = await (await get('/privacy/')).text();
const title = privacy.match(/<title>([^<]*)<\/title>/)?.[1];
report(title === 'Privacy Policy - Karacho', 'title of /privacy/', `got "${title}"`);
// Technical files
await expectStatus(200, '/feed.rss', { contentType: 'application/rss+xml' });
await expectStatus(200, '/sitemap.xml', { contentType: 'application/xml' });
await expectStatus(200, '/robots.txt');

// Every image keeps its URL and its bytes
const images = (await readdir(imageSource, { recursive: true, withFileTypes: true }))
  .filter((entry) => entry.isFile() && /\.(png|jpg|svg)$/.test(entry.name))
  .map((entry) => path.relative(imageSource, path.join(entry.parentPath, entry.name)))
  .sort();
for (const image of images) {
  await expectStatus(200, `/images/${image}`, { body: await readFile(path.join(imageSource, image)) });
}
// Trailing-slash forms
for (const [from, to] of [
  ['/privacy', '/privacy/'],
  ['/index.html', '/'],
  ['/privacy/index.html', '/privacy/'],
]) {
  await expectRedirect(308, from, to);
}

// Unknown paths. Cloudflare's edge may serve a deleted file from its cache for up to a week;
// the query string asks the deployment itself.
const fresh = `?fresh=${Date.now()}`;
for (const gone of ['/does-not-exist', '/privacy.html', '/support/', '/images/screenshots/iphone-02-standstill.jpg']) {
  await expectStatus(404, gone + fresh);
}

if (failures > 0) {
  console.log(`${failures} of ${checks} checks failed.`);
  process.exit(1);
}
console.log(`All ${checks} checks passed.`);
