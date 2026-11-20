# JES.CO / Jesres Glam Studio — Frontend

React (Vite) single-page app for the JES.CO brand site and Jesres Glam Studio (bookings, courses, gallery, shop, skin analysis).

See the [root README](../README.md) for full project context, backend setup, and architecture. This file covers the frontend only.

## Tech Stack

React 19 + Vite 8 + Tailwind CSS 4 + Framer Motion + React Router 7 + hls.js (course video playback) + react-helmet-async (per-page meta tags)

## Setup

```bash
npm install
npm run dev
```

Requires a `.env` with:

```
VITE_PAYSTACK_PUBLIC_KEY   # Paystack public key (inline checkout)
VITE_WHATSAPP_NUMBER       # international format, no leading '+'
```

> No API URL needed locally — `vite.config.js`'s dev proxy forwards `/api` to `127.0.0.1:8000`.
> `VITE_API_URL` is no longer used by any code (as of 2026-11-18): axios's `baseURL` comes from
> `import.meta.env.DEV`, and is empty in production so calls stay same-origin and `vercel.json`'s
> rewrite proxies them. On Vercel, **never mark a `VITE_` variable "Sensitive"** — `vercel pull`
> replaces the value with the literal string `[SENSITIVE]` outside Vercel's own build container.
> See `DEPLOYMENT.md`.

## Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # Run ESLint
npm run preview   # Preview a production build locally
```

## Structure

```
src/
├── api/          API client layer
├── components/   Shared UI components
├── context/      React context providers
├── hooks/        Custom hooks
├── pages/        Route-level pages
└── utils/        Helpers
```
