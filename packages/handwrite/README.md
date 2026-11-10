# Handwrite.io

Send physical handwritten cards through Handwrite.io (written by robots with real pens, with a handwritten envelope and a real stamp). Covers listing handwriting styles and stationery, sending a card to 1-10 recipients, and reading an order's status and proofs.

**Interface:** hand-written tools over the vendor's REST API (`https://api.handwrite.io/v1`), documented at https://documentation.handwrite.io/. Handwrite publishes no OpenAPI document of its own (only a third-party one exists, which this package does not use), so the four documented endpoints are written by hand: `handwritings`, `stationery`, `getOrder` and `send`. `send` requires approval.

**Auth:** API key. Create one in the developer dashboard of your Handwrite.io account (https://app.handwrite.io). Keys starting with `test_hw` are free and not counted toward usage; `live_hw` keys are charged per card. The key is sent as the raw `Authorization` header value. The API has no OAuth.

**Icon:** the official site icon of handwrite.io (the script "h" favicon declared in the page head of https://www.handwrite.io/), fetched as a 500x500 PNG from its Squarespace CDN URL (https://images.squarespace-cdn.com/content/v1/60913ac7bb926d0a3d3236c3/3c29e0ec-9d4b-4158-8f5b-78652e2ecb3f/favicon.ico?format=500w) and used uncropped. Generated with `scripts/icon.ts`.

**Known gaps:** the batch form of `/send` (an array of up to 1,000 single-recipient orders) is not exposed; call `send` once per message. Rate limit is 60 requests per minute per key. The health check lists handwriting styles because the API has no account endpoint.
