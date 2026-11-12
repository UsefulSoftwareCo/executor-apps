# Lodgify

Lodgify is vacation rental software. This package covers Lodgify's Public API v2 (`v2`, 19 tools): properties, rooms and deleted properties, availability calendars, daily rates and rate settings, quotes, bookings (list, read, external bookings, key codes, payment links, check-in and check-out) and messaging threads. It also covers v1 (`v1`, 54 tools): bookings and enquiries (create, update, delete, status changes such as book, decline, reopen and replied, and messages), availability updates, rates, add-ons, payment settings, quotes, countries, currencies, the channel XML index and webhooks.

**Interface:** OpenAPI. Lodgify publishes one OpenAPI document per version in its ReadMe reference at https://docs.lodgify.com/reference. The v1 document is also in ReadMe's public API registry (`https://dash.readme.com/api/v1/api-registry/1r3vdmvp00hhj`). The v2 document (`lodgify-public-api-v2.json`) is served only to a browser that passes the docs site's Cloudflare check. Both are therefore committed, as `v1.json` and `v2.json`, by `scripts/vendor-openapi.ts lodgify` (its header explains how to save the v2 document from a browser). Each file records its source URL, SHA-256 and retrieval date in `info.x-executor-source`. The two versions are mounted separately because their operations overlap (both have properties, availability, bookings and quotes).

The quote endpoints (`v1.reservations.getQuote`, `v2.reservations.getQuote`) take room types and add-ons as indexed query keys. Lodgify's reference says the encoding generated from its documents is invalid and documents `roomTypes[0].Id`, `roomTypes[0].guest_breakdown.adults` and so on. `openapi.ts` patches the documents to those keys, for one room type and one add-on per quote.

**Auth:**
- API key (`apiKey`): sent in the `X-ApiKey` header to `api.lodgify.com`, the scheme both of Lodgify's documents declare. Create the key in your Lodgify account's public API settings. The exact menu path is not confirmed in Lodgify's docs.
- OAuth: Lodgify's documents define only the `X-ApiKey` scheme, and its docs mention no user-created OAuth apps. Only the API key is offered.

**Known gaps:**
- Lodgify's documents list `application/json-patch+json` first for request bodies, and that is the content type sent. This is the ASP.NET default, whose JSON input formatter also accepts `application/*+json`. It has not been tried against the live API.
- Channel-manager endpoints are not in either document.
- The quote patch covers one room type and one add-on per request.
- Refreshing v2 needs a browser (see `scripts/vendor-openapi.ts`). Without `--lodgify-v2`, only v1 is refreshed.

**Icon:** Lodgify's app icon (yellow tile with the L mark) from the thesvg.org collection, https://thesvg.org/icon/lodgify. Lodgify's own press page was unreachable.
