// Vercel Routing Middleware — serves known crawlers a real pre-rendered
// snapshot (via Prerender.io) instead of the empty SPA shell, while every
// other visitor gets the site completely unchanged. See CLAUDE.md's
// "Discoverability" section (Tier 3) and the discoverability_seo memory
// for why this approach was chosen over a React Router 7 Framework Mode
// migration or vite-react-ssg.
//
// Requires a PRERENDER_TOKEN env var set in Vercel (free tier at
// prerender.io, no card needed, covers 1,000 cached pages — comfortably
// above this site's real page count).

const BOT_USER_AGENTS = [
  'googlebot', 'bingbot',
  'gptbot', 'claudebot', 'anthropic-ai', 'google-extended',
  'perplexitybot', 'ccbot', 'oai-searchbot',
]

// Same reasoning already used in robots.txt: only intercept real page
// navigations, never static assets or API calls — those should always
// pass through unchanged regardless of who's requesting them.
const STATIC_ASSET_RE = /\.(js|css|png|jpg|jpeg|svg|webp|ico|json|txt|xml|woff2?)$/i

export function isKnownBot(userAgent: string): boolean {
  const ua = (userAgent || '').toLowerCase()
  return BOT_USER_AGENTS.some(bot => ua.includes(bot))
}

export default async function middleware(request: Request) {
  const url = new URL(request.url)
  const userAgent = request.headers.get('user-agent') || ''

  const isAsset = STATIC_ASSET_RE.test(url.pathname) || url.pathname.startsWith('/api/')

  if (isAsset || !isKnownBot(userAgent)) {
    return // fall through to normal static/rewrite handling, unchanged
  }

  const prerenderUrl = `https://service.prerender.io/${url.origin}${url.pathname}${url.search}`
  const rendered = await fetch(prerenderUrl, {
    headers: { 'X-Prerender-Token': process.env.PRERENDER_TOKEN || '' },
  })

  return new Response(await rendered.text(), {
    status: rendered.status,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  })
}

export const config = { runtime: 'edge' }
