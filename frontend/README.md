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
VITE_API_URL   # Django backend URL
```

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
