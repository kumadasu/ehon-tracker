# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # start dev server (http://localhost:5173)
pnpm build        # tsc + vite build
pnpm lint         # ESLint
pnpm format       # Prettier (write)
pnpm format:check # Prettier (check only)
pnpm test         # Vitest watch mode
pnpm coverage     # Vitest with coverage report
```

Run a single test file:

```bash
pnpm test src/utils/dateUtils.test.ts
```

## Architecture

**Storage** uses `localStorage` exclusively via `src/services/storage.ts`. All data flows through `useBooks()`.

**External API calls** (all `fetch`, no SDK):

- `src/services/googleBooks.ts` — Google Books API (no key required)

**Barcode scanning** uses `@zxing/browser` `BrowserMultiFormatReader`. `decodeFromVideoDevice` returns `IScannerControls`; call `controls.stop()` to clean up (not `reader.reset()`). Requires HTTPS — on `localhost` the camera prompt will fail and the manual ISBN input fallback is shown automatically.

**Theme and fonts** are defined in `src/constants/theme.ts` (COLORS, FONTS). All inline styles reference these constants. Google Fonts (DM Serif Display + Noto Serif JP) are loaded in `index.html`.

## Language convention

- All code, comments, variable names, and documentation: **English**
- User-visible UI strings only: **Japanese**

## Testing conventions

See `docs/TESTING.md` for the full policy. Key rules:

- Test names: `"when [condition], it should [expected result]"`
- Structure: `// Arrange / // Act / // Assert` comments
- Mock only at external boundaries (HTTP, localStorage, datetime). If >3 mocks are needed, reconsider the design.
- Use `msw` for HTTP mocking, `vi.stubGlobal('fetch', vi.fn())` for one-off fetch stubs.

## Environment

Copy `.env.example` to `.env` and optionally set `VITE_GOOGLE_BOOKS_API_KEY` to use a dedicated Books API key.
