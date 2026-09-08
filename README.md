# ehon-tracker

A web app for keeping track of picture books borrowed from the library — what you have out, and when each one is due back. Scan the barcode on the back cover and the book's details are filled in for you.

**https://ehon.kumadasu.com**

## Features

- Barcode scanning, with manual ISBN entry as a fallback
- Book details fetched automatically from the Google Books API
- Magazine issues looked up through the NDL Search API, for the many Japanese magazines that carry a JAN code rather than an ISBN
- Borrowed books grouped by due date, with the days remaining on each group
- Bulk due-date change per group, for when a stack of books is scanned a day late or a loan is extended
- Star rating and a memo per book, kept after it is returned
- Add a group's due date to Google Calendar
- No account and no sign-in — every book you record is kept in `localStorage` on the device. The only server-side piece is a small proxy for the NDL API, which stores nothing.

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`.env` is optional. `VITE_GOOGLE_BOOKS_API_KEY` sets a dedicated Books API key; without it the app uses the shared quota, which is enough for personal use.

Barcode scanning needs HTTPS. On `localhost` the camera prompt fails and the app falls back to manual ISBN entry automatically.

## Commands

```bash
pnpm dev          # start dev server (http://localhost:5173)
pnpm build        # tsc -b && vite build
pnpm test         # Vitest, watch mode
pnpm coverage     # Vitest with coverage (what CI runs)
pnpm lint         # ESLint
pnpm format       # Prettier (write)
pnpm format:check # Prettier (check only)
```

## Stack

- React 19 + TypeScript + Vite
- PWA via `vite-plugin-pwa` (offline support)
- Google Books API and NDL Search API — plain `fetch`, no SDK
- `@zxing/browser` for barcode scanning
- CSS Modules, with the palette as CSS variables in `src/styles/theme.css`
- Vitest + Testing Library
- Cloudflare Pages, with a Pages Function proxying the NDL API
