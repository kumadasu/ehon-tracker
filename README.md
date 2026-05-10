# ehon-tracker

A web app for managing your children's picture book collection. Scan barcodes to look up ISBNs and automatically fetch book details from Google Books.

**https://ehon.kumadasu.com**

## Features

- Barcode scanning or manual ISBN entry
- Automatic book details via Google Books API
- Track read/unread/favorite status
- Google Drive sync for multi-device access
- Google Calendar integration for read-aloud logs
- Works offline with localStorage — Google sign-in is optional

## Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

Set `VITE_GOOGLE_CLIENT_ID` in `.env` to enable Google Drive / Calendar sync. Without it the app runs in localStorage-only mode.

## Commands

```bash
pnpm dev      # start dev server (http://localhost:5173)
pnpm build    # production build
pnpm test     # run tests
pnpm lint     # ESLint
pnpm format   # Prettier
```

## Stack

- React 19 + TypeScript + Vite
- PWA (offline support)
- Google Identity Services (OAuth)
- Google Books / Drive / Calendar APIs (fetch, no SDK)
- @zxing/browser (barcode scanning)
- Vitest + Testing Library
- Cloudflare Pages
