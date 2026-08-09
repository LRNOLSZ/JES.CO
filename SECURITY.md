# Security — JES.CO / Jesres Glam Studio Backend

Full inventory of security measures actually implemented in this codebase, as of **2026-08-09**. Every item below has a confirmed file reference — this isn't a plan or aspiration, it's what's really in the code today. For the audit that closed out the last known gaps, see the "Security Audit" table in `CLAUDE.md`.

This file supersedes the old "Security & Access Rules" bullets that used to live in `CLAUDE.md` — two of those were inaccurate:
- *"Access middleware to protect media from expired users"* — never built as literal Django middleware. The actual mechanism is a serializer-level `is_access_expired` check at the point a video URL is generated (see Video/Content Protection below) — functionally the same protection, different implementation.
- *"Subscription tiers with 90/180 day expiry logic"* — the real model is a flat 180-day (6-month) expiry per course purchase, not tiered by subscription level.

---

## Authentication & Sessions

- **Fully loginless.** The `accounts` app is vestigial — `accounts/urls.py` is empty, `accounts/views.py` is just a comment ("Student-facing auth removed — platform is loginless for all users"). Only a bare `User` model remains, used solely for Django's own admin login.
- **Magic-link course access** — `CourseAccessToken` (`courses/models.py`): single-use token, 24-hour expiry. Requesting a new link invalidates any unused prior token for that email (`create_for_email`).
- **Session limiting** — `CourseSession` (`courses/models.py`): max 2 concurrent device sessions per email (`MAX_SESSIONS = 2`); requesting a 3rd auto-kicks the oldest. 8-hour session expiry.

## Rate Limiting

- **Hand-rolled, IP-keyed, 10/min**: magic-link request (`request_access_link`), purchase-check (`check_purchase`), order-tracking (`OrderTrackingView`) — all in `courses/views.py` / `products/views.py`.
- **Hand-rolled, other keys**: skin-analysis submission (5/hour, IP-keyed, `skin_analysis/views.py`); course comment posting (5 per 12 hours, keyed by authenticated session email rather than IP, `courses/views.py`).
- **Spoof-resistant IP extraction** — shared `get_client_ip()` helper (`core/views.py`). Takes the *last* `X-Forwarded-For` entry rather than the first, since Railway's edge proxy appends the real client IP to the chain instead of replacing it — the first entry is attacker-controlled.
- **Global throttle floor** — `DEFAULT_THROTTLE_CLASSES`/`DEFAULT_THROTTLE_RATES` in `settings.py` (`REST_FRAMEWORK` block): 100/min anonymous, 300/min authenticated. Applies automatically to every endpoint that doesn't define its own throttle — the safety net under everything above, including any future endpoint. See the `AFFECTED BY GLOBAL THROTTLE` comment at that exact settings block before adding a new sensitive endpoint.

## Payment Security

- **Webhook signature verification** — `jesrestudio_backend/views.py`'s `paystack_webhook`: single webhook endpoint for the whole project, HMAC-SHA512 signature check against `X-Paystack-Signature` using `hmac.compare_digest` (timing-attack-resistant comparison, not a plain `==`).
- **Server-side price re-verification** — every checkout path (course purchase, shop order, skin-analysis) independently recomputes the expected charge amount and compares it against what Paystack actually reports; client-supplied amounts are never trusted. A mismatch is flagged, access/fulfillment withheld, and an admin alert email sent — never silently accepted.

## Admin Hardening

- **Brute-force lockout** — `django-axes`: locks a login after 10 failed attempts, 1-hour auto-cooloff, keyed by IP address (`AXES_FAILURE_LIMIT`, `AXES_COOLOFF_TIME`, `AXES_LOCKOUT_PARAMETERS` in `settings.py`).
- **Non-default admin URL** — moved from `/admin/` (the most bot-scanned path on any public Django site) to `/tweneboa/` (`jesrestudio_backend/urls.py`).
- **Idle session timeout** — 15 minutes (`SESSION_COOKIE_AGE = 900` + `SESSION_SAVE_EVERY_REQUEST = True` in `settings.py`), protects Maame Ama if she forgets to sign out on a shared/borrowed device.

## Transport Security

- `SECURE_SSL_REDIRECT`, `SECURE_PROXY_SSL_HEADER` (aware that Railway terminates HTTPS at its edge and forwards plain HTTP internally — without the proxy header, Django can't tell a request was already secure).
- `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` — cookies never sent over plain HTTP in production.
- `SECURE_HSTS_SECONDS` — tells browsers to never attempt plain HTTP on this domain again after the first successful HTTPS visit. Currently a conservative 1-day value (`jes.co` isn't purchased yet); ratchet up toward the standard one-year value once the real domain and subdomain layout are finalized.
- `CORS_ALLOWED_ORIGINS` — locked to known frontend origins (local dev + the live Vercel domain), never a wildcard.

## Video / Content Protection

- **Signed, expiring video URLs** — `jesrestudio_backend/bunny_storage.py`: Bunny Stream URLs carry a directory-scoped token + 8-hour expiry when `BUNNY_TOKEN_AUTH_KEY` is configured (it is, in production). A copied URL from DevTools stops working after 8 hours instead of working forever.
- **Fail-open protection for the above** — if that signing key is ever accidentally unset in production, two independent alarms fire: a Django system check (`check_bunny_signing`, runs on every deploy) and a logged warning at the exact moment an unsigned URL would be generated. Neither changes the underlying security logic — they just make a future regression loud instead of silent.
- **Concurrent-stream limiting** — `video_heartbeat` (`courses/views.py`) caps active playback at 2 concurrent streams per email+course.
- **Access-expiry enforcement on playback** — `CourseDetailSerializer.get_has_access` (`courses/serializers.py`) checks `CoursePurchase.is_access_expired`, not just whether a purchase row exists. An expired student's `course_video_url` is `None`, not a valid signed link.

## Input Sanitization

- **HTML-escaped user text in admin emails** — `skin_analysis/views.py`: `full_name`, `allergies_detail`, `additional_notes` are wrapped in `django.utils.html.escape()` before being interpolated into the branded admin notification email (whose `MESSAGE` field renders as raw HTML).
- **Unicode control/format-character rejection** — `skin_analysis/serializers.py`: rejects characters in Unicode categories `Cc` (control) and `Cf` (format — covers null bytes, zero-width spaces, right-to-left override spoofing tricks) on the same free-text fields.
- **Image upload size caps** — `validate_image_size_5mb` (`courses/models.py`), 5MB limit on testimonial/comment before/after photos.

## Secrets Management

- All credentials read via `.env` + `python-decouple` — never hardcoded in source.
- `.env` (and `.env.local`, `frontend/.env`, `frontend/.env.local`) confirmed present in `.gitignore` — never committed.

---

## Known accepted gaps / deferred items

- **`bookings_bookingrequest` table on production Postgres** — the `bookings` app was fully removed (2026-08-09, dead code — Calendly handles bookings externally now), including a clean local migration drop. That same drop never reaches Railway's production database since the migration file was deleted along with the app. The table is near-certainly empty (the endpoint was never reachable from any live UI) and orphaned-but-harmless. Optional manual `DROP TABLE bookings_bookingrequest;` on Railway if full cleanup is ever wanted.
- **Safari native HLS playback** (see `deploy_readiness` memory / video-protection history) — genuine Safari takes a native playback path with no token-injection hook available, unlike Chrome/Firefox via hls.js. Smaller, isolated, not yet revisited.
- **`includeSubDomains`/`preload` on HSTS** — deliberately not added yet; revisit once `jes.co` is purchased and its subdomain layout is final.
