# Public first-load JavaScript budget

Using Node 22, build and start the matching production output in one terminal:

```sh
pnpm --filter admin-shadcn build
pnpm --filter admin-shadcn start --port 8092
```

Then run `pnpm --filter admin-shadcn check:bundle`. Set `BUNDLE_BASE_URL` for a different origin.
The server and local `.next` directory must belong to the same build.

The guard sums the uncompressed bytes of unique Next.js JavaScript files referenced by
HTML script tags on `/`, `/pricing` and guest `/community`. It excludes speculative
prefetch, lazy-loaded chunks, inline Flight data and third-party analytics. This is not
the same measurement as Lighthouse's transferred JavaScript, which includes compression
and scripts requested after hydration.

The limits in `bundle-budget.json` are 10% above the measured baseline: 1,695,241 bytes
for home/pricing and 2,399,891 for community. Exceeding any limit, unavailable pages,
missing build assets or empty/non-app HTML cause a nonzero exit. Review a fresh production
measurement before deliberately updating a limit; never increase limits automatically.

Run the guard's unit tests with `node --test scripts/check-bundle-size.test.mjs`.
CI integration is left separate because the guard needs a running production server.
