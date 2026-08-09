# JES.CO / Jesres Glam Studio

A beauty brand platform for **JES.CO** (parent brand) and **Jesres Glam Studio** (its beauty-service subsidiary) — makeup artistry bookings, video-based courses, a skin-analysis consultation, and a curated product shop. Serves clients in Accra & Kumasi, Ghana, and Denver, Colorado, USA.

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 6.0 + Django REST Framework + PostgreSQL |
| Frontend | React 19 (Vite) + Tailwind CSS 4 + Framer Motion |
| Admin | Django Unfold (Purple/Gold theme) |
| Media | Cloudflare R2 (images), Bunny Stream (course video, HLS) |
| Auth | Passwordless magic link (student access), token auth (admin) |
| Email | Brevo (transactional — magic links, receipts, admin notifications) |
| Payments | Paystack (courses, shop, skin analysis) |
| Hosting | Railway (backend), Vercel (frontend) |

## Project Structure

```
jesrestudio/
├── jesrestudio_backend/   Django project config (settings, root URLs, WSGI)
├── accounts/              Auth — magic link login, sessions
├── bookings/               Multi-step booking form + notifications
├── core/                  Shared site content (homepage, brand info)
├── courses/               Course catalog, purchases, video gating, comments
├── gallery/                Before/after portfolio, category filters
├── products/              Shop — product catalog, cart, order tracking, Paystack
├── skin_analysis/          Paid skin-analysis consultation quiz
├── frontend/               React (Vite) SPA
│   └── src/
│       ├── api/            API client layer
│       ├── components/     Shared UI components
│       ├── context/        React context providers
│       ├── hooks/          Custom hooks
│       ├── pages/          Route-level pages
│       └── utils/          Helpers
└── manage.py
```

## Setup

### Backend

```bash
# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Create a .env file — see "Environment Variables" below

# Apply migrations
python manage.py migrate

# Create an admin user
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Common Commands

```bash
# Backend
python manage.py makemigrations         # Generate migrations for model changes
python manage.py migrate                # Apply migrations
python manage.py test                   # Run all tests
python manage.py test <app>.<TestClass> # Run a single test class

# Frontend
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview a production build locally
```

## Environment Variables

Backend `.env` (not committed):

```
SECRET_KEY, DEBUG
DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT
ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS
CLOUDFLARE_R2_* (image storage)
BUNNY_* (video hosting + signed URLs)
BREVO_* (transactional email)
PAYSTACK_* (payments)
WHATSAPP_NUMBER, MAAME_AMA_EMAIL
```

Frontend `.env`:

```
VITE_API_URL   # Django backend URL
```

## Key Features

- **Magic link auth** — passwordless student login, no password storage
- **Video-gated courses** — purchase-based access, signed Bunny Stream URLs, 2-device concurrent session limit
- **Skin analysis** — paid quiz-based consultation with personalized product recommendations
- **Shop** — cart, dual-region pricing (GHS/USD), Paystack checkout, order tracking
- **Booking** — multi-step booking form with email notifications
- **Admin panel** — Django Unfold, brute-force protected (`django-axes`), idle session timeout

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — full architecture notes, decision changelog, deployment lessons, and the pending security audit punch list
