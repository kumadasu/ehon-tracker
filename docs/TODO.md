# TODO

## Features

### Japanese magazine JAN code support

- Japanese magazines use JAN codes (EAN-13 starting with 491/492) instead of ISBNs
- Google Books API does not cover magazines
- Need an alternative data source (e.g.楽天Books API, NDL Search API)
- Barcode scanner already reads EAN-13; the gap is the lookup step

### Calendar without Google sign-in

- Currently the Google Calendar integration requires OAuth (drive.file + calendar.events scopes)
- Goal: allow read-aloud logs to be recorded without signing in
- Options:
  - Store logs locally (localStorage) and sync to Calendar only when signed in
  - Replace Calendar with a local log view built into the app

## Bugs / Improvements

_(none yet)_
