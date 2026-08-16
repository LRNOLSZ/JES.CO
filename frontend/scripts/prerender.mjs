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

const DIST_DIR = new URL('../dist/', import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, '$1')
const API_URL = process.env.VITE_API_URL || 'http://localhost:8000'

const STATIC_ROUTES = [
  '/', '/studio', '/studio/gallery', '/studio/testimonials',
  '/studio/skin-analysis', '/studio/courses',
  '/products/makeup', '/products/skincare', '/products/collections',
]

async function getCourseRoutes() {
  try {
    const res = await fetch(`${API_URL}/api/courses/`)
    if (!res.ok) throw new Error(`courses API returned ${res.status}`)
    const courses = await res.json()
    return courses.map(c => `/studio/courses/${c.slug}`)
  } catch (err) {
    console.warn(`[prerender] Could not fetch course list (${err.message}) — skipping dynamic course routes this build.`)
    return []
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
  await copyFile(join(DIST_DIR, 'index.html'), join(DIST_DIR, 'app-shell.html'))

  const server = await preview({ preview: { port: 4321, strictPort: true } })
  const baseUrl = server.resolvedUrls.local[0].replace(/\/$/, '')

  const browser = await chromium.launch()
  const routes = [...STATIC_ROUTES, ...await getCourseRoutes()]

  let succeeded = 0
  let failed = 0

  for (const route of routes) {
    const page = await browser.newPage()
    try {
      await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(500) // let any final async render settle
      const html = await page.content()
      const filePath = routeToFilePath(route)
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, html)
      console.log(`[prerender] OK    ${route} -> ${filePath}`)
      succeeded++
    } catch (err) {
      console.warn(`[prerender] SKIP  ${route} — ${err.message}`)
      failed++
    } finally {
      await page.close()
    }
  }

  await browser.close()
  await server.httpServer.close()

  console.log(`[prerender] Done: ${succeeded} succeeded, ${failed} skipped.`)
  // A single failed page never fails the whole build — the site still
  // works for that route via app-shell.html, same as before this feature
  // existed. Only exit non-zero for something that stops the script
  // entirely (handled by an uncaught exception below, not here).
}

main().catch(err => {
  console.error('[prerender] Fatal error, aborting build:', err)
  process.exit(1)
})
