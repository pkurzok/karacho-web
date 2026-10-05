# Karacho website

The source of <https://karacho.peterkurzok.de>: the homepage and the privacy policy of Karacho,
a digital speedometer for iPhone. It is an [Astro](https://astro.build) project that builds to
static files; this repository is the only source of the site.

The app's own repository is called Speedo, its working title. Everything a visitor reads says
Karacho.

## Requirements

- Node 22 (`.nvmrc`)
- `npm ci` once after cloning

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Serves the site locally with live reload, by default at <http://localhost:4321/> |
| `npm run build` | Type-checks the project and builds the site into `dist/` |
| `npm run check` | Builds, then verifies `dist/`: expected files, images, links, file sizes |
| `npm run preview` | Serves the built `dist/` locally |
| `npm run check:live -- <base-url>` | Verifies a deployed site against the URL contract below |

Run `npm run check` before pushing. It prints one line per check and fails when a link dangles
or a published file is missing.

## Where content lives

| Content | File |
|---|---|
| Hero, features, Support, download text, navigation, footer | `src/data/site.ts` |
| Screenshot list with alt texts and captions | `src/data/site.ts` (`screenshots`) |
| Privacy policy | `src/pages/privacy.md` |
| 404 page | `src/pages/404.astro` |
| `robots.txt` | `public/robots.txt` |
| Markup of a section | `src/components/` |
| Page frame: `<head>`, header, footer | `src/layouts/Base.astro` |
| Styles | `src/styles/site.css` |

A Support entry, a feature text or a footer link is one edit in `src/data/site.ts`.

The site is dark only, like the app. Its two colours are the dial's: `#0A0C10` for the ground
and `#FFB020` for the amber.

## Launch status

`app.status` in `src/data/site.ts` is the one value to change as the launch proceeds:

| Value | Hero and download band | When |
|---|---|---|
| `'announced'` | A button to the screenshots, and "Write to me" | Until the app is in the App Store |
| `'preorder'` | The "Pre-order on the App Store" badge | After App Review approved the pre-order |
| `'released'` | The "Download on the App Store" badge | On launch day |

`'preorder'` and `'released'` need `app.appStoreId` and `app.appStoreUrl`
(`https://apps.apple.com/app/id<appStoreId>`). Both are empty today. The build stops when a
badge has no address to link to, and the Smart App Banner tag is written only once the id is set.
`npm run check` verifies that the built homepage matches the status.

## Editing the privacy policy

The policy is `src/pages/privacy.md`, plain Markdown. When the wording changes, update the
"Last updated" line at the top of the text and the date that `scripts/check-dist.mjs` expects.
App Store Connect and the app link to `/privacy/`, so the path must stay.

The policy describes the app as it ships. The app is prepared to show banners for other indie
apps in its free version, but that is switched off. Before it is switched on, the policy needs
a section naming that service and what it receives.

## Support

The App Store listing's support URL is `/#support`, the section with the questions and the
mail address. The id is checked by `npm run check`; do not rename it.

## Images

Originals live in `src/assets/images/` and exist only there.

- They are published unchanged under `/images/…` by `src/pages/images/[...file].ts`.
- The pages show smaller variants that Astro derives from the same originals at build time.
- The screenshots and the app icon come from the app repository:
  `make site-assets SITE=<this folder>` there copies the five framed en-US screenshots and the
  icon here. It empties `src/assets/images/screenshots/` of `.jpg` files first.
- Every screenshot needs an entry in `screenshots` in `src/data/site.ts`. `npm run check` fails
  when files and entries do not match.
- The en-US screenshots show mph. Alt texts and captions name no number, so they stay true when
  the images are re-shot.
- `hero.image` and the default link-preview image in `src/layouts/Base.astro` name
  `iphone-01-driving.jpg`. `npm run check` fails when the link-preview image is not in the build.

No file above 25 MiB may enter the build: Cloudflare Pages rejects it and the whole deployment
fails. `npm run check` fails for such a file.

## Deployment

The Cloudflare Pages project `karacho-web` builds the site itself; there is nothing to upload.

- A push to `main` deploys to <https://karacho.peterkurzok.de>.
- Any other branch gets a preview at `https://<branch>.karacho-web.pages.dev`.
- Build settings in the Cloudflare dashboard (Settings, Builds & deployments): build command
  `npm run build`, build output directory `dist`, environment variable `NODE_VERSION` = `22`
  for production and preview.
- A failed build shows up as the "Cloudflare Pages" check on the commit in GitHub; the log is in
  the Cloudflare dashboard. The live site keeps its last successful deployment.

Check a preview before merging, and production after:

```sh
npm run check:live -- https://<branch>.karacho-web.pages.dev
npm run check:live -- https://karacho.peterkurzok.de
```

Cloudflare's edge may keep answering for a deleted file from its cache for up to a week.
`check:live` therefore asks for its 404 paths with a query string, which bypasses that cache.

### Rollback

In the Cloudflare dashboard open the Pages project, go to Deployments and choose "Rollback" on
an earlier deployment. That takes effect at once and needs no commit. Follow up by reverting
the offending commit on `main`, so that the next push does not bring the problem back.

## URL contract

These addresses are linked from the app and from App Store Connect and must keep working.
`npm run check:live` tests every line.

| Address | Answer |
|---|---|
| `/`, `/privacy/` | 200 |
| `/privacy`, `/index.html`, `/privacy/index.html` | 308 to the form with a trailing slash |
| `/feed.rss`, `/sitemap.xml`, `/robots.txt` | 200 |
| every file in `src/assets/images/`, under `/images/…` | 200, identical bytes |
| anything else | 404 with the 404 page |

`public/_redirects` is empty on purpose. The 308 answers are Cloudflare Pages' own; the site
has never had other addresses to forward.
