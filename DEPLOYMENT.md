# Deployment — JES.CO / Jesres Glam Studio

How this project is hosted, configured, and what's already gone wrong once (so it doesn't have to go wrong twice). As of **2026-08-09**.

---

## Where It's Hosted

- **Backend** (Django/DRF/Postgres) — **Railway**: `https://web-production-ae068.up.railway.app`
- **Frontend** (React/Vite) — **Vercel**: `https://jes-co.vercel.app`
- They're deployed and scaled completely independently, talking over HTTPS/CORS only — no shared infrastructure, no server-side rendering.

Both are git-push deploys off the `master` branch (not `main` — see the branch-mismatch gotchas below, this has bitten the project on *both* platforms).

---

## Environment Variables Reference

Every variable the backend actually reads via `config(...)` (`python-decouple`), grouped by concern. Set these in Railway's **Variables** tab for production; a local `.env` (gitignored) covers dev.

**Core Django**
| Var | Purpose |
|---|---|
| `SECRET_KEY` | Django's cryptographic signing key — required, no default |
| `DEBUG` | `True` locally, `False` in production — gates most other security settings via `not DEBUG` |
| `ALLOWED_HOSTS` | Comma-separated hostnames Django will serve |

**Database**
| Var | Purpose |
|---|---|
| `DATABASE_URL` | Railway sets this automatically once Postgres is linked to the web service — parsed via `dj_database_url`. Takes priority over the discrete vars below if present. |
| `DB_ENGINE` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` / `DB_HOST` / `DB_PORT` | Fallback for local dev when `DATABASE_URL` isn't set |

**CORS / Frontend linkage**
| Var | Purpose |
|---|---|
| `CORS_ALLOWED_ORIGINS` | Comma-separated origins allowed to call the API — must include the live Vercel URL in production |
| `FRONTEND_URL` | Used to build links inside outgoing emails (magic links, etc.) |
| `BACKEND_URL` | Used to build "View in Admin" links inside admin-alert emails |

**Email (Brevo, HTTP API)**
| Var | Purpose |
|---|---|
| `BREVO_API_KEY` | Auth for Brevo's transactional email API — **not** SMTP credentials, this project doesn't use SMTP in production (see gotcha #2 below) |
| `MAAME_AMA_EMAIL` | Where admin alert/notification emails go |

**Payments**
| Var | Purpose |
|---|---|
| `PAYSTACK_SECRET_KEY` | Server-side key for HMAC webhook verification. Empty by default — the webhook stays gated (503) until set. |

**Media storage (Cloudflare R2 — images)**
| Var | Purpose |
|---|---|
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` / `R2_ENDPOINT_URL` | All four must be present for R2 to activate (`R2_CONFIGURED`) — otherwise media falls back to local `/media/` |
| `R2_PUBLIC_DOMAIN` | Optional custom CDN domain for serving R2 files |

**Video storage (Bunny Stream)**
| Var | Purpose |
|---|---|
| `BUNNY_API_KEY` / `BUNNY_LIBRARY_ID` / `BUNNY_CDN_URL` | Required for video upload/storage to activate (`BUNNY_CONFIGURED`) |
| `BUNNY_TOKEN_AUTH_KEY` | **Security-critical** — without this, video URLs silently fall back to permanent unsigned links. See `SECURITY.md` for the alarms that now fire if this ever goes missing. |

**Misc**
| Var | Purpose |
|---|---|
| `WHATSAPP_NUMBER` | International format, no `+` — used to build `wa.me` links |

**Frontend (Vercel env vars, not Railway)**
| Var | Purpose |
|---|---|
| `VITE_API_URL` | Points the frontend's axios instance at the Railway backend — without it, axios falls back to `http://localhost:8000` |
| `VITE_PAYSTACK_PUBLIC_KEY` | Paystack's public key — safe to expose client-side, used to open the inline checkout popup |

---

## Railway-Specific Setup

- **Build Command vs. Pre-Deploy Command are genuinely different filesystems.** `python manage.py collectstatic --noinput` must run in the **Build Command** (bakes into the image); `python manage.py migrate --noinput` must run in the **Pre-Deploy Command**. Putting both in the same step looks like it works (logs show `collectstatic` succeeding) but the *running* container never sees the collected files — they were written to a disposable build-time filesystem, not the deployed one.
- **`Procfile`**: `release: python manage.py migrate --noinput && python manage.py collectstatic --noinput` / `web: gunicorn jesrestudio_backend.wsgi:application --timeout 300`. The `--timeout 300` matters — the gunicorn default (30s) silently kills any video upload over roughly 50MB.
- **Railway terminates HTTPS at its edge** and forwards plain HTTP internally. `SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')` in `settings.py` is required — without it, Django can never tell a request was actually secure, and `SECURE_SSL_REDIRECT` redirects every request to HTTPS forever (`ERR_TOO_MANY_REDIRECTS`).
- **Railway blocks outbound SMTP.** This is why email goes through Brevo's HTTP API (`jesrestudio_backend/email_backends.py`) instead of Django's built-in SMTP mail backend — confirmed via a real `TimeoutError` connecting to `smtp-relay.brevo.com:587` in production. Any future email-sending code must go through `send_branded_email()`, never raw `django.core.mail`.
- **Postgres doesn't auto-link to the web service.** Adding the Postgres plugin creates it as a separate Railway service; you have to explicitly set the web service's `DATABASE_URL` to reference the Postgres service's own `DATABASE_URL` via Railway's variable-reference picker.

## Vercel-Specific Setup

- **`vercel.json` SPA rewrite is required**: `{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }`. Without it, refreshing on any route other than `/` (e.g. `/studio`) returns a real `404: NOT_FOUND` from Vercel's server, since React Router only handles routing client-side and a hard refresh asks the server for a literal path that doesn't exist as a file.
- **Production Branch must track `master`, not `main`.** Vercel's Settings → Environments → Production has its own branch-tracking setting, separate from GitHub's default branch — set it explicitly, or every push only creates Preview deployments while the live domain keeps serving an old build.
- **`VITE_API_URL` must be set** or the frontend silently falls back to `http://localhost:8000` in production (19 files originally called bare `axios.get('/api/...')`, relying on Vite's dev-only proxy — fixed by setting `axios.defaults.baseURL` once in `main.jsx`).

---

## What Broke And How It Was Fixed (dated incident log)

Real incidents from the initial deploy, kept because they're the most useful reference if redeploying from scratch or hitting something that *feels* similar.

1. **GitHub default branch mismatch** — GitHub's auto-created `main` had only a README; all real code was on `master`. Railway's first deploy pulled `main` and failed with "no source code to build." Fixed by changing GitHub's default branch to `master` (repo Settings → Branches).
2. **Frontend used relative `/api/...` axios calls** — only worked locally because Vite's dev proxy silently forwarded `/api` to `localhost:8000`. Fixed by setting `axios.defaults.baseURL` globally in `frontend/src/main.jsx`.
3. **Env vars not yet added to Railway on first boot** — `SECRET_KEY`/`DB_NAME` etc. simply hadn't been copied into Railway's Variables tab yet.
4. **Postgres not linked to the web service** — see Railway-specific setup above.
5. **`ERR_TOO_MANY_REDIRECTS`** — see `SECURE_PROXY_SSL_HEADER` above.
6. **`relation "courses_course" does not exist`** — migrations were never run against the new Railway Postgres, because Railway's builder doesn't auto-run a Heroku-style `release:` Procfile line; `migrate` had to be set explicitly in **Settings → Deploy → Pre-Deploy Command**.
7. **`Missing staticfiles manifest entry`** — see Build vs. Pre-Deploy Command split above.
8. **Django silently swallowing 500 errors** — no `LOGGING` config existed, so Django's default behavior (email admins instead of printing, when `DEBUG=False`) meant production crashes left nothing in Railway's logs. Fixed with the explicit `LOGGING` dict now in `settings.py`.
9. **No way to log into the live admin** — production Postgres started completely empty. Fixed via a **temporary** non-interactive superuser creation pass (`DJANGO_SUPERUSER_*` env vars + a one-time `createsuperuser --noinput` in the pre-deploy step, reverted immediately after — leaving it in permanently would crash every future deploy re-trying to create the same username).
10. **Admin bot-hardening** — renamed the admin URL from `/admin/` to `/tweneboa/` directly in `jesrestudio_backend/urls.py`.
11. **CORS blocking the live frontend** — `CORS_ALLOWED_ORIGINS` needed the live Vercel URL added once it existed.
12. **Vercel SPA routing 404 on refresh** — see `vercel.json` above.
13. **Vercel Production Branch mismatch** — see Vercel-specific setup above.

## Deploy Checklist (standing this up fresh, or onboarding a new developer's mental model)

1. Push code to `master` on GitHub (confirm it's actually the repo's default branch).
2. Railway: create the Postgres plugin, link its `DATABASE_URL` to the web service via the variable-reference picker.
3. Railway: set every env var from the reference table above (copy real values from a working `.env`, don't invent placeholders).
4. Railway: set **Build Command** to include `collectstatic --noinput`; set **Pre-Deploy Command** to `migrate --noinput`. Keep them separate.
5. Confirm `Procfile`'s `web:` line has `--timeout 300` on gunicorn.
6. First deploy: temporarily add a non-interactive `createsuperuser` pass to get into `/tweneboa/`, then remove it.
7. Vercel: set `VITE_API_URL` to the Railway backend URL, `VITE_PAYSTACK_PUBLIC_KEY` to the real public key.
8. Vercel: confirm `frontend/vercel.json`'s SPA rewrite is present, and Production Branch tracking is set to `master`.
9. Once both are live: add the real Vercel URL to Railway's `CORS_ALLOWED_ORIGINS`, and the real Railway URL to `FRONTEND_URL`/`BACKEND_URL`.
10. Set Paystack's webhook URL (in Paystack's own dashboard, Settings → API Keys & Webhooks) to `https://<railway-url>/api/paystack/webhook/` — this is a **separate manual step Paystack never reminds you about**; without it, payments succeed client-side but nothing ever happens on the backend.
