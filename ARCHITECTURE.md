# Architecture — JES.CO / Jesres Glam Studio

A developer-facing overview of how this project is actually built, as of **2026-08-09**. If you're new to this codebase, read this before touching anything.

For security-specific detail (auth, rate limiting, payment verification, etc.), see **`SECURITY.md`** — this file covers structure and data flow, not the security reasoning behind it. For hosting/environment-variable/deploy detail, see **`DEPLOYMENT.md`**.

---

## System Overview

A Django + Django REST Framework backend serves a JSON API; a separate React (Vite) frontend consumes it. They're deployed independently — backend on Railway, frontend on Vercel — and talk to each other purely over HTTP/CORS, no shared session cookies or server-side rendering.

The defining architectural decision of this project: **it's fully loginless.** There are no customer/student passwords anywhere. Course access is granted via one-time magic-link emails; the shop has no accounts at all (guest checkout only, cart lives in the browser). The only real "login" in the whole system is Maame Ama's own Django admin account.

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Backend | Python, Django 6.0, Django REST Framework 3.16 | |
| Database | PostgreSQL | via `psycopg2-binary` locally, `dj-database-url` parses Railway's `DATABASE_URL` in production |
| Admin | `django-unfold` | themed Royal Purple/Gold, custom navigation, dashboard callback in `core/admin.py` |
| Frontend | React 19, Vite, React Router 7 | |
| Styling | Tailwind CSS 4 | via `@tailwindcss/vite` |
| Animation | Framer Motion | |
| HTTP client | axios | single shared instance, `baseURL` set from `VITE_API_URL` |
| Video playback | hls.js | for HLS streaming from Bunny; Safari uses its native engine instead |
| Images | `django-imagekit` (server-side WebP conversion/resizing) | |
| Static files | WhiteNoise | serves Django's own static assets (admin CSS/JS) in production |
| Media storage | Cloudflare R2 (`django-storages` + `boto3`, S3-compatible) | opt-in, falls back to local `/media/` in dev |
| Video storage | Bunny Stream | custom `Storage` backend, not a package — see `jesrestudio_backend/bunny_storage.py` |
| Payments | Paystack | webhook-driven, single shared endpoint for all three paid flows |
| Email | Brevo, via HTTP API (not SMTP) | custom backend, see `jesrestudio_backend/email_backends.py` |
| Admin brute-force protection | `django-axes` | |

## Backend App Map

Each Django app's **real, current** purpose — not what it may have been originally scoped for:

- **`core`** — site-wide content that isn't specific to any one feature: `SiteSettings` (footer/contact), `PageImages`, `SocialLink`, `Testimonial`, `IntroVideo`, `Announcement`, and `BookingRevenue` (a manual admin-only entry for bookings arranged outside the system, e.g. a bridal booking negotiated directly with Maame Ama — unrelated to any booking *feature*, since there isn't one anymore). Also owns the shared `get_client_ip()` helper and `get_ghs_usd_rate()` used by other apps, and the Unfold admin dashboard callback.
- **`courses`** — the loginless course platform. The most complex app by far: `Course`/`CourseTier` (catalog), `CoursePurchase` (who bought what, 180-day expiry), `CourseAccessToken`/`CourseSession` (magic-link auth + 2-device session limit), `VideoHeartbeat` (concurrent-stream limiting), `CourseComment` (moderated comments, some promoted to testimonials).
- **`products`** — the shop: `ProductItem` (with GHS + optional USD pricing), `DeliveryZone`, `Order`/`OrderItem`. No account/cart model — guest checkout, cart lives entirely in frontend `localStorage`.
- **`skin_analysis`** — a single-purpose paywalled quiz: `SkinAnalysisSubmission` holds all 10 quiz answers plus payment state; on payment, Maame Ama gets emailed the answers to review and reply to personally. No product-matching logic lives in code — the "recommendation" is manual, done by Maame Ama.
- **`gallery`** — before/after portfolio: `GalleryItem` with category filters and a `publish_at` field for scheduled posts (draft/scheduled/live via a computed `status` property).
- **`accounts`** — **vestigial.** `accounts/urls.py` is an empty list; `accounts/views.py` is just a comment ("Student-facing auth removed — platform is loginless for all users"). Only a bare `User(AbstractUser)` model remains, needed solely because `AUTH_USER_MODEL` must point somewhere for Django's own admin login. Don't build new customer-facing features here — this app predates the loginless pivot and isn't where auth logic actually lives (that's `courses` for students, Django's own `auth`/`axes` for Maame Ama).
- **`jesrestudio_backend`** — the project package itself, but also home to code shared across apps: the single Paystack webhook (`views.py`), the Brevo email backend (`email_backends.py`), and both custom storage backends (`bunny_storage.py`, `storage_backends.py`).

## Data Flow — Three Traced Examples

**1. Course purchase → access granted**
Frontend calls Paystack's inline popup directly (no backend round-trip at checkout time) → Paystack calls the single shared webhook `POST /api/paystack/webhook/` → HMAC-SHA512 signature verified (`hmac.compare_digest`) → routed by metadata shape to `_process_course_charge` (`courses/views.py`) → server independently recomputes the expected price and rejects/flags a mismatch → `CoursePurchase.objects.update_or_create(...)` (180-day expiry) → a `CourseAccessToken` is minted and emailed via `send_branded_email`. The frontend never learns of success from the webhook directly — it shows an optimistic "processing" UI and polls/refetches.

**2. Student watches a video**
Student clicks a magic link → `verify_access_token` consumes the token, creates a `CourseSession` (kicks the oldest if already at 2 devices) → frontend stores the session key in `localStorage`, sends it as `X-Course-Session` on every course request → `CourseDetailSerializer.get_has_access` checks the purchase exists **and** isn't expired → if true, `course_video_url` is populated with a Bunny Stream URL signed with an 8-hour token → `VideoPlayer.jsx` picks hls.js (Chrome/Firefox/Android) or Safari's native `<video>` engine based on `canPlayType()`, re-attaching the same token to every nested hls.js request (manifest, quality sub-playlists, `.ts` segments) since Bunny doesn't rewrite those automatically → separately, `video_heartbeat` is pinged every 30s and caps concurrent streams at 2 per email+course.

**3. Shop checkout**
Cart is built and persisted entirely client-side (`CartContext`, `localStorage` key `jes_cart`) — the backend has no concept of a cart until checkout. At checkout, region (`RegionContext`, Ghana/USA) determines currency; Paystack (Ghana-only settlement account) charges in GHS regardless, with USD shown for transparency on USA orders. On payment, the webhook's `_process_product_charge` (`products/views.py`) creates the `Order`/`OrderItem` rows, re-verifies the price server-side, and decrements `ProductItem.quantity`. The customer tracks status later via `GET /api/orders/track/?ref=...&email=...` (rate-limited) — no account needed, just the order reference + email they used.

## Frontend Structure

**Routes** (`App.jsx`) — two distinct site "halves" sharing one React app: the JES.CO brand homepage (`/`) and the Jesres Glam Studio pages (`/studio/*`), plus shop (`/products/:category`, `/cart`, `/track-order`) and the course platform (`/studio/courses/*`).

**Context providers** — each owns one slice of client-side state, all backed by `localStorage` for persistence across reloads:
- `CourseSessionContext` — the active magic-link session (email, purchased courses, `refreshPurchases`). Deliberately reads `localStorage` fresh on every call rather than closing over state, to avoid a stale-closure bug that bit this project once (a page writing a new session key immediately after verification wouldn't have been picked up by a stale closure).
- `CartContext` — shop cart (`jes_cart` key), no backend involvement until checkout.
- `RegionContext` — Ghana/USA region + derived currency (`jes_region` key), drives price display and delivery zone options.
- `AuthContext` — **dead code, confirmed.** Not wrapped around the app anywhere in `App.jsx` (no `<AuthProvider>`), and its only consumers, `AuthVerifyPage.jsx`/`DashboardPage.jsx`, aren't referenced by any route either — leftover from an earlier, pre-loginless-pivot auth design (see the frontend mirror of the `accounts` backend app note below).

**`api/`** — currently just `auth.js`; most components call axios directly against the shared `baseURL` rather than going through a dedicated API layer per feature.

**Notable component patterns**:
- `VideoPlayer.jsx` — the single component every video-playing page should use (three separate instances of a "plain `<video>` tag instead of this component" bug have been found and fixed historically — always use this, never a raw `<video>`).
- `ScrollToTop.jsx` — mounted once in `App.jsx`, resets scroll position on every route change; replaced 5 duplicated per-page `window.scrollTo(0,0)` calls.

## Storage Architecture

- **Images → Cloudflare R2** (`jesrestudio_backend/storage_backends.py`, `R2MediaStorage`). Opt-in via `R2_CONFIGURED` (all four `R2_*` env vars present) — falls back to local `/media/` filesystem storage otherwise, same as Django's own default. Used for product photos, gallery before/afters, testimonial images, thumbnails.
- **Video → Bunny Stream** (`jesrestudio_backend/bunny_storage.py`, `BunnyStreamStorage`). Not an S3-style bucket — a custom `Storage` subclass that uploads via Bunny's own video API and generates signed, directory-scoped, expiring (8h) HLS playlist URLs. Opt-in via `BUNNY_CONFIGURED`; falls back to local `FileSystemStorage` if unset.
- **Static files (Django admin CSS/JS) → WhiteNoise**, always, regardless of R2 configuration — `CompressedManifestStaticFilesStorage`.
- **Cloudinary is still an installed dependency and configured in `settings.py`, but is no longer actually used anywhere** — it was the original video host, replaced by Bunny Stream on 2026-07-01 (cost + streaming quality). Left in place for reference/rollback only; don't build new features against it.

## Auth Model

No passwords, no accounts, for anyone except Maame Ama (Django admin, `django-axes`-protected). Every other "identity" in the system is either:
- an **email address** the person typed in (skin-analysis, shop orders, booking-adjacent flows) — never verified beyond format, since there's nothing to protect behind it, or
- a **magic-link-derived session** (`CourseSession`, course platform only) — the one place actual access control matters, since it gates paid video content.

Full detail on how each of these is actually protected (rate limiting, session limits, HMAC verification, etc.) is in `SECURITY.md`, not repeated here.

## Known Architectural Notes Worth Knowing Before You Build Something New

- **Cache backend is `LocMemCache`** (`settings.py` `CACHES`) — in-process, per-worker, not shared. Every rate limit in this project (magic link, purchase-check, order-tracking, skin-analysis, the global DRF throttle) implicitly assumes a single gunicorn worker, since counts aren't shared across processes. This is fine at current traffic/worker-count, but if the app ever scales to multiple workers or dynos, these limits would become *per-worker* instead of global — effectively multiplying the real limit by however many workers are running. Would need Redis (or another shared cache backend) to fix, not a rewrite of the rate-limiting logic itself.
- **No backend shopping cart model at all** — by design, not an oversight. The cart is pure frontend state (`localStorage`) until the moment of order creation.
- **`accounts` app is dead weight** beyond the base `User` model — don't extend it for new customer-facing features; follow the `courses` app's magic-link pattern instead if a new feature needs identity without full accounts.
- **Frontend has the same kind of dead weight**: `AuthContext.jsx`, `AuthVerifyPage.jsx`, `DashboardPage.jsx`, and `api/auth.js` are all unrouted/unwrapped — confirmed via a grep across `frontend/src`, none of the three files are referenced from `App.jsx`. Almost certainly the frontend half of an earlier, pre-`CourseSessionContext` auth design. Don't build on these without first confirming they're actually meant to come back — the working pattern for course access today is `CourseSessionContext` + the `X-Course-Session` header, not this.
- **Two storage backends with very different shapes** (R2 = S3-compatible bucket via `django-storages`; Bunny = fully custom `Storage` subclass hitting Bunny's own API) — don't assume `FileField`s behave identically across the codebase; check which storage a given model's field actually uses before assuming URL generation or `.delete()` behavior.
