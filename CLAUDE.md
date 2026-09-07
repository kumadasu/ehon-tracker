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

- `src/services/googleBooks.ts` — Google Books API, ISBN lookup for scanned books. Key optional (`VITE_GOOGLE_BOOKS_API_KEY`); the request omits the `key` param when it is unset.
- `src/services/ndlSearch.ts` — NDL Search API, magazine issue lookup. Returns XML, parsed with `DOMParser`. It always requests the relative path `/api/ndl/opensearch`, which `vite.config.ts` proxies to `ndlsearch.ndl.go.jp` **in dev only** — the repo carries no production equivalent of that rewrite.

**Barcode scanning** uses `@zxing/browser` `BrowserMultiFormatReader`. `decodeFromVideoDevice` returns `IScannerControls`; call `controls.stop()` to clean up (not `reader.reset()`). Requires HTTPS — on `localhost` the camera prompt will fail and the manual ISBN input fallback is shown automatically.

**Styling** uses CSS Modules — every component has a `*.module.css` beside it, and there are no inline `style` props. Colors and fonts live as CSS variables in `src/styles/theme.css`; `src/styles/global.css` holds the reset and page chrome. Both are imported once from `main.tsx`. Combine class names with `cx()` from `src/utils/cx.ts` (`cx(styles.card, urgent && styles.urgent)`). Styles shared by sibling components go in a lowercase module such as `src/components/sheetForm.module.css`. Google Fonts (DM Serif Display + Noto Serif JP) are loaded in `index.html`.

## Language convention

- All code, comments, variable names, and documentation: **English**
- User-visible UI strings only: **Japanese**

## Testing conventions

See `docs/TESTING.md` for the full policy. Key rules:

- Test names: `"when [condition], it should [expected result]"`
- Structure: `// Arrange / // Act / // Assert` comments
- Mock only at external boundaries (HTTP, localStorage, datetime). If >3 mocks are needed, reconsider the design.
- Use `msw` for HTTP mocking, `vi.stubGlobal('fetch', vi.fn())` for one-off fetch stubs.

CI runs `pnpm coverage`, not `pnpm test` — it enforces a **per-file 90% branch threshold**. A file with no tests is absent from the report and therefore ungated, so adding the first test to one puts it under the threshold immediately: cover its branches in the same change, and verify with `pnpm coverage` before pushing.

## Environment

Copy `.env.example` to `.env` and optionally set `VITE_GOOGLE_BOOKS_API_KEY` to use a dedicated Books API key.
