# Minelead

Find and verify professional emails with Minelead: domain search (with optional enrichment and AI deep search), find by name, real-time verification, lead enrichment, buying intent reports, social (YouTube and Twitter/X) email finder, and disposable email detection.

Interface: hand-written tools over Minelead's REST API at `https://api.minelead.io/v1/`, taken from the vendor's per-API pages: https://minelead.io/email-finder-api/, https://minelead.io/email-verifier-api/, https://minelead.io/lead-enrichment-api/, https://minelead.io/buying-intent-api/, https://minelead.io/social-email-finder-api/ and https://minelead.io/disposable-email-api/. Minelead publishes no OpenAPI document, GraphQL API or MCP server.

Auth: API key. Create it in your Minelead account (https://minelead.io/); the vendor pages show it as `YOUR_API_KEY`. Executor sends it as the `key` query parameter to `api.minelead.io` only. There is no OAuth.

Tools: `search`, `find`, `validate`, `enrich`, `buyingIntent`, `socialEmailFinder`, `detectDisposable`. All are read-only lookups, but most consume Minelead credits.

Known gaps: Minelead documents no account or credit-balance endpoint, so the connection check calls `detect-disposable`, the cheapest documented call (1 credit per check). A bad key returns HTTP 200 with `status: "error"` ("Unauthorized Access"), a valid key returns `status: "success"`. No vendor endpoints for four further operations were found in Minelead's public docs, so they are not included.
