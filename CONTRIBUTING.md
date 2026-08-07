# Contributing

## Running it

```bash
npm install
npm start
```

This is an Expo app. `npm run android` / `npm run ios` build to a device or
simulator; `npm run start:go` runs it under Expo Go if you don't need the
custom native modules.

## Running the tests

```bash
npm test
```

Runs `tests/dateParser.test.js` and `tests/expiry.test.js` directly with
Node, no test framework. If you touch date math, also run:

```bash
npm run test:tz
```

which re-runs the expiry tests under `America/New_York` and `Asia/Tokyo` to
catch timezone bugs.

## Before opening a PR

- Everything runs on-device. No new network calls, accounts, or analytics.
- Photos of items stay local; don't add anything that uploads them anywhere.
- Keep the folder icons and tone consistent with the existing set if you're
  adding UI, this one is deliberately drawn and cute rather than generic.

## Reporting a bug

What you did, what you expected, what happened. If it's a date or expiry
calculation, include the date you entered, your device's timezone, and what
the app showed.
