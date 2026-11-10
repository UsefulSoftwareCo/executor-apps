# Lodgify

Lodgify is vacation rental software. This package covers properties and rooms, availability, daily rates and rate settings, priced quotes, bookings (create, read, update, delete, payment links, key codes, check-in and check-out), messaging threads and webhook subscriptions.

**Interface:** OpenAPI. No official Lodgify OpenAPI document or MCP server was found (Lodgify's API reference at https://docs.lodgify.com/reference could not be fetched during authoring, so its contents are unverified). The package uses the unofficial API Evangelist profile of the Lodgify Public API, pinned to a commit: https://raw.githubusercontent.com/api-evangelist/lodgify/84518bae3be302ae0b3779e479d0d5c915c57a24/openapi/_original/lodgify-openapi.yml. It is a third-party description, not maintained by Lodgify, and its completeness relative to the official API is unverified.

**Auth:**
- API key (`apiKey`): sent in the `X-ApiKey` header to `api.lodgify.com` (from the spec's security scheme). Create the key in your Lodgify account's public API settings; the exact menu path is not verified against vendor docs.
- OAuth: the spec defines only the `X-ApiKey` scheme, and no user-created OAuth app could be confirmed in Lodgify's docs (unreachable during authoring). Only the API key is offered.

**Known gaps:** the spec covers 23 operations, all exposed as tools. Lodgify's own reference may include further endpoints (for example v1 reservations and enquiries, countries, currencies, message posting) that this description lacks; this could not be verified against vendor docs. Because the description is third-party, a few operations may differ from Lodgify's live API. Channel-manager endpoints are not covered.

**Icon:** Lodgify's app icon (yellow tile with the L mark) from the thesvg.org collection, https://thesvg.org/icon/lodgify. Lodgify's own press page was unreachable.
