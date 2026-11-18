// Runs after `vite build`. Boots the just-built site locally, visits every
// real page with a headless browser (Playwright), and saves what it sees as
// plain static HTML files. Vercel then serves those files directly to
// anyone who requests them — human or crawler — instead of the empty SPA
// shell, with zero per-request middleware/decision needed.
//
// See CLAUDE.md's "Discoverability" section (Tier 3) and the
// discoverability_seo memory for the full reasoning — this replaced a
// Prerender.io-based approach that turned out to cost $49/month after a
// 30-day trial.

import { preview } from 'vite'
import { chromium } from 'playwright'
import { mkdir, writeFile, copyFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// fileURLToPath (not `.pathname`) because `.pathname` percent-encodes the
// path — any space in a parent directory name became a literal `%20` and
// broke every file write on Windows (e.g. "django projects" -> "django%20projects").
// It also handles the leading-slash-before-drive-letter case that the old
// hand-rolled regex was there to strip.
const DIST_DIR = fileURLToPath(new URL('../dist/', import.meta.url))

const STATIC_ROUTES = [
  '/', '/studio', '/studio/gallery', '/studio/testimonials',
  '/studio/skin-analysis', '/studio/courses',
  '/products/makeup', '/products/skincare', '/products/collections',
]

// Markers that prove a page actually rendered REAL data, not an empty state.
// Every one of these returned zero matches while the 2026-08-22..2026-11-18
// regression was live, and is non-empty on a healthy build — they're the exact
// checks that diagnosed it. Routes absent from this map only need to render:
// `/` and `/studio` carry hardcoded Organization/BeautySalon JSON-LD, so
// asserting on that would pass even with no data and give false confidence.
const DATA_ASSERTIONS = {
  // Renders images.home_hero_url / home_studio_feature_url as <img> once the
  // /api/page-images/ fetch lands, and has no static <img> of its own — so any
  // <img> at all proves the data arrived.
  '/': [{ label: 'at least one <img> tag', test: /<img\b/ }],
  '/studio': [{ label: 'at least one <img> tag', test: /<img\b/ }],
  '/studio/gallery': [{ label: 'at least one <img> tag', test: /<img\b/ }],
  '/studio/courses': [
    { label: 'at least one course link', test: /\/studio\/courses\/[a-z0-9-]{10,}/ },
  ],
  '/products/makeup': [{ label: 'product JSON-LD', test: /application\/ld\+json/ }],
  '/products/skincare': [{ label: 'product JSON-LD', test: /application\/ld\+json/ }],
  '/products/collections': [{ label: 'product JSON-LD', test: /application\/ld\+json/ }],
  // Deliberately NOT asserted: /studio/testimonials and /studio/skin-analysis.
  // Both can legitimately render with no DB rows (no approved testimonials
  // yet), so there's no marker that distinguishes "no data available" from
  // "data not fetched" — asserting would produce false build failures.
}

// Applied to every dynamically-discovered course detail route.
const COURSE_ASSERTIONS = [{ label: 'course JSON-LD', test: /application\/ld\+json/ }]

// Playwright errors carry a multi-line call log; one line is enough per route.
function firstLine(err) {
  return (err?.message || String(err)).split('\n')[0]
}

function assertionsFor(route) {
  if (DATA_ASSERTIONS[route]) return DATA_ASSERTIONS[route]
  if (/^\/studio\/courses\/[^/]+$/.test(route)) return COURSE_ASSERTIONS
  return []
}

// Fetched through the preview server so the proxy in vite.config.js is the
// single place the backend URL lives. Deliberately throws instead of
// returning [] — returning an empty list on failure is precisely how this
// silently produced zero course pages across ~85 days of green builds.
async function getCourseRoutes(baseUrl) {
  const res = await fetch(`${baseUrl}/api/courses/`)
  if (!res.ok) {
    throw new Error(
      `courses API returned ${res.status} via the preview proxy. ` +
      `Check the /api proxy target in vite.config.js and that the backend is reachable.`
    )
  }
  const courses = await res.json()
  if (!courses.length) {
    throw new Error(
      'courses API returned an empty list — refusing to build with zero course pages. ' +
      'If the catalogue is genuinely empty, remove this guard deliberately.'
    )
  }
  return courses.map(c => `/studio/courses/${c.slug}`)
}

// Renders one route and returns its HTML, or throws.
//
// Deliberately NOT `waitUntil: 'networkidle'` + a fixed delay, which was the
// original approach and proved unreliable in BOTH directions:
//   - it fires too early on fast pages (the network goes quiet in the gap
//     between the bundle finishing and React's useEffect dispatching its
//     fetches), so pages got captured before their data arrived — this is how
//     `/` silently lost its hero image;
//   - it never fires at all on course detail pages, whose embedded HLS video
//     player keeps the network permanently busy — a guaranteed 30s timeout.
//
// Instead: wait for the page's own data markers to actually appear in the DOM.
// Same regexes used for the assertions below, so "when is it ready" and "is it
// correct" can never disagree.
async function renderRoute(browser, baseUrl, route) {
  const page = await browser.newPage()
  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'load', timeout: 30000 })

    for (const a of assertionsFor(route)) {
      await page.waitForFunction(
        source => new RegExp(source).test(document.documentElement.outerHTML),
        a.test.source,
        { timeout: 20000 },
      )
    }
    // Routes with no markers still need a beat for React to mount and render.
    await page.waitForTimeout(assertionsFor(route).length ? 250 : 1500)

    return await page.content()
  } finally {
    await page.close()
  }
}

function routeToFilePath(route) {
  if (route === '/') return join(DIST_DIR, 'index.html')
  return join(DIST_DIR, route.replace(/^\//, ''), 'index.html')
}

async function main() {
  // Preserve the plain, page-agnostic shell vite build already produced —
  // this becomes the fallback for any route NOT pre-rendered (private
  // pages, anything not in the route list yet), before we start
  // overwriting dist/index.html with real per-page content.
  //
  // ⚠️ This assumes `vite build` ran immediately before, so dist/index.html
  // is still the generic shell. Running this script twice without rebuilding
  // in between copies the already-pre-rendered homepage into app-shell.html,
  // so every private route's first paint becomes the homepage. Harmless in
  // the real pipeline (`npm run build` always rebuilds first, and CI starts
  // from a clean checkout) but easy to trip over when iterating locally:
  // always re-run the full `npm run build`, not just this script.
  await copyFile(join(DIST_DIR, 'index.html'), join(DIST_DIR, 'app-shell.html'))

  const server = await preview({ preview: { port: 4321, strictPort: true } })
  const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, '')

  const browser = await chromium.launch()
  const routes = [...STATIC_ROUTES, ...await getCourseRoutes(baseUrl)]

  let succeeded = 0
  let skipped = 0
  const dataFailures = []

  for (const route of routes) {
    let html = null
    let lastErr = null

    // Two attempts. This pass fires 100+ requests at a backend whose global
    // anon throttle is 100/min, so a late-run 429 or a slow response is
    // plausible and usually transient; the pause between tries also spreads
    // the load out a little.
    for (let attempt = 1; attempt <= 2 && html === null; attempt++) {
      try {
        html = await renderRoute(browser, baseUrl, route)
      } catch (err) {
        lastErr = err
        if (attempt < 2) {
          console.warn(`[prerender] RETRY ${route} — ${firstLine(err)}`)
          await new Promise(r => setTimeout(r, 5000))
        }
      }
    }

    if (html === null) {
      // For a route WITH data markers, failing to render means the markers
      // never appeared — that is the missing-data case, not a transient
      // navigation blip, so it fails the build. For a route with nothing to
      // verify, warn and carry on: app-shell.html still serves it.
      const expected = assertionsFor(route)
      if (expected.length) {
        dataFailures.push({ route, missing: expected.map(a => a.label) })
        console.error(`[prerender] NODATA ${route} — ${firstLine(lastErr)}`)
      } else {
        console.warn(`[prerender] SKIP  ${route} — ${firstLine(lastErr)}`)
        skipped++
      }
      continue
    }

    // renderRoute already waited for these, but re-check the captured HTML
    // before writing anyway: a page that rendered without its real data must
    // not overwrite a good file, and must not pass quietly. This is the alarm
    // that was missing for ~85 days.
    const missing = assertionsFor(route)
      .filter(a => !a.test.test(html))
      .map(a => a.label)
    if (missing.length) {
      dataFailures.push({ route, missing })
      console.error(`[prerender] NODATA ${route} — missing: ${missing.join(', ')}`)
      continue
    }

    const filePath = routeToFilePath(route)
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, html)
    console.log(`[prerender] OK    ${route} -> ${filePath}`)
    succeeded++
  }

  await browser.close()
  await server.httpServer.close()

  console.log(
    `[prerender] Done: ${succeeded} rendered, ${skipped} skipped, ` +
    `${dataFailures.length} missing data.`
  )

  if (dataFailures.length) {
    console.error('\n[prerender] BUILD FAILED — pages rendered without their real data:')
    for (const f of dataFailures) {
      console.error(`    ${f.route} — missing ${f.missing.join(', ')}`)
    }
    console.error(
      '\n  The build-time API calls returned no usable data. Most likely:\n' +
      "    - the /api proxy target in vite.config.js can't reach the backend\n" +
      '    - the backend returned 429 (global anon throttle is 100/min)\n' +
      '    - the backend is down or mid-redeploy\n' +
      '\n  Failing on purpose. A green build that quietly ships empty pages is\n' +
      '  exactly how this went unnoticed from 2026-08-22 to 2026-11-18. The\n' +
      '  deploy step will not run, so the last good deployment stays live.\n'
    )
    process.exit(1)
  }
}

main().catch(err => {
  console.error('[prerender] Fatal error, aborting build:', err)
  process.exit(1)
})
