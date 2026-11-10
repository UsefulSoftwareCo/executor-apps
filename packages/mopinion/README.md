# Mopinion

Read access to Mopinion customer feedback: the account, deployments, datasets, reports, their fields, and feedback items with Mopinion's filters (date, rating, NPS, CES, GCR, tags) and pagination. 11 read-only tools.

## Interface

Hand-written tools over Mopinion's official Data API (`https://api.mopinion.com`, documented at https://developer.mopinion.com, spec at https://developer.mopinion.com/specs/3_0_x.json). This is the current Data API spec; its `info.version` reads `3.0.0-alpha`, but it is the version the developer portal serves by default and lists first. The published spec is Swagger 2.0 and declares no security scheme, because every request must carry an `x-auth-token` signed per request, which the generic OpenAPI router cannot produce. The tools sign requests themselves and send `version: 3.0.0`.

## Auth

One method: Feedback API credentials. Create a Feedback API credential set in Mopinion and enter the **public key** and the **signature token** (the private key is not needed). The signature token is used to compute an HMAC-SHA256 of each request path, so the app reads it (the connect form flags it as readable by the app). Credentials are only sent to `api.mopinion.com`.

## Known gaps

The Data API 3.0 spec is read-only (GET only), so there are no create or update tools. The portal also lists Data API 2.latest (spec https://developer.mopinion.com/specs/2_latest.json, info.version 2.5.2), 2.5.x, 2.4.x and 2.3.x; we checked each spec and all of them are GET-only too (2.latest has 10 operations: the same resources plus `/ping` and `/token`), so no write tools are missing by targeting 3.0. The `/ping` and `/token` endpoints are not wrapped.
