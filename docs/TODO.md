# TODO

## Bugs / Improvements

### Scanning a magazine barcode gives no feedback

Japanese magazines carry a JAN code (EAN-13 starting with 491/492) instead of an
ISBN. `toIsbn13` returns `null` for those, and `ScannerView` simply keeps
scanning — so pointing the camera at a magazine looks like the scanner is broken.

Magazines can already be registered through the 📖 雑誌 button, which searches the
NDL Search API by title, year and issue number. The gap is only the scan path.

Options, cheapest first:

- Recognise a 491/492 prefix and tell the user to use the magazine search instead
- Take them straight to the magazine search when a JAN code is scanned
- Look the JAN code up directly, if a data source that maps JAN to issue exists

## Notes

`functions/` (the Cloudflare Pages Function proxying the NDL API) is covered by
`pnpm lint` but not by `tsc -b` or the tests — a mistake there surfaces only after
deploying. Left as is deliberately; see the Deployment section of `CLAUDE.md`.
