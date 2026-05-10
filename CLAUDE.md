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

**Storage is dual-mode.** All data flows through `useBooks(drive)`:
- `drive = null` → reads/writes `localStorage` via `src/services/storage.ts`
- `drive = { accessToken, driveFileId }` → reads/writes `ehon-books.json` in the user's Google Drive via `src/services/driveStorage.ts` (Drive REST API, no SDK)

Drive writes are debounced 800 ms. On first sign-in, any existing localStorage data is migrated to Drive and localStorage is cleared.

**Auth is optional.** `useAuth` (`src/hooks/useAuth.ts`) reads `VITE_GOOGLE_CLIENT_ID` from env. When the env var is absent, `auth.enabled = false` and the sign-in button is hidden — the app works entirely offline with localStorage. The GIS access token is cached in `sessionStorage`; on mount, `useAuth` attempts to restore the session silently.

**Google Identity Services (GIS)** is loaded as a CDN script in `index.html` (not an npm package). Its types are declared in `src/types/google.d.ts`. `src/services/gis.ts` wraps `google.accounts.oauth2.initTokenClient` into a Promise-based `requestAccessToken()`.

**External API calls** (all `fetch`, no SDK):
- `src/services/googleBooks.ts` — Google Books API (no key required)
- `src/services/driveStorage.ts` — Drive v3 REST API (`drive.file` scope)
- `src/services/googleCalendar.ts` — Calendar v3 REST API (`calendar.events` scope)

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

Copy `.env.example` to `.env` and set `VITE_GOOGLE_CLIENT_ID` to enable sign-in. Without it the app runs in localStorage-only mode.

**OAuth consent screen:** Keep in **Testing** mode on Google Cloud Console and add your own Google account as a test user. Drive sync is intended for the owner's personal multi-device use only (no sharing). External visitors to the deployed site use localStorage mode without signing in and do not need OAuth access. The scopes used (`drive.file`, `calendar.events`) are sensitive but do not require verification in Testing mode.
