# CDR Platform

Quote and purchase carbon dioxide removal with CDR Platform (Climacrux), and look up removal certificates: `price`, `purchase` and `getCertificate`. `purchase` places a billed order and requires approval.

**Interface:** hand-written tools over the documented REST API (`https://api.cdrplatform.com/v1`, docs at https://docs.cdrplatform.com/). CDR Platform documents an OpenAPI 3.0 schema (drf-spectacular, `https://api.cdrplatform.com/schema/`, with Swagger and Redoc viewers), but the API origin has never served it to us: the original attempt got 522/525, and on 2026-10-12 retries at 11:20-11:21 UTC returned curl 000 (timeout, 20s) for `/schema/` and two alternative paths, and 525 for an unauthenticated POST to `/v1/cdr/price/`. The docs page itself (docs.cdrplatform.com) returned 200, so only the API origin is down. The schema could not be compiled, so the tool set is not confirmed to be the full API. The three tools wrap the endpoints in the vendor's open-source routing (`cdr/price/`, `cdr/`, `certificate/<id>/`). There is no official MCP server.

**Auth:** API key, sent as `Authorization: Api-Key <key>` (not Bearer). Request a key from CDR Platform as described at https://docs.cdrplatform.com/docs/authentication-and-security. The vendor offers no OAuth. The health check requests a one-kilogram price quote, which creates nothing; it is used because that is the one authenticated, non-mutating endpoint the docs confirm (the unauthenticated-looking `GET v1/health/` is not documented as authenticated).

**Icon:** the vendor's own square logo from its open-source `Climacrux/api.cdrplatform.com` repository (`assets/img/logo--square--colour.svg`), from the vendor's API repository for the CDR Platform product, so it is the product's mark rather than a Climacrux corporate logo (the docs site's logo could not be fetched to compare byte-for-byte), with its black outline drawn white in the dark variant.

**Known gaps:** no endpoint for listing removal methods or past orders is documented, so valid `method_type` values come from the vendor docs. When the vendor's OpenAPI document is reachable it could replace these hand-written tools.

**Input validation:** `currency` (usd, eur, gbp, chf), `weight_unit` (g, kg, t), `cdr_amount` (integer, at least 1) and the certificate id format (`abc-def-ghi`) are enforced by the input schema before any vendor call.
