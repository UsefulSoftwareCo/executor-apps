# BunnyCDN (bunny.net)

Manage a bunny.net account: pull zones, storage zones, DNS zones, cache purge, statistics, billing and API keys (core), Edge Scripting (compute), Shield WAF, rate limits and access lists (shield), Magic Containers apps and registries (magicContainers), and raw CDN request logs (logging). 254 tools in total.

## Interface

OpenAPI, from bunny.net's official documents, mounted under one router each (four on `https://api.bunny.net`, logging on `https://logging.bunnycdn.com`):

- core (111): https://core-api-public-docs.b-cdn.net/docs/v3/public.json
- compute (23): https://core-api-public-docs.b-cdn.net/docs/v3/compute.json
- shield (65): https://api.bunny.net/shield/docs/v1/swagger.json
- magicContainers (53): https://api-mc.opsbunny.net/docs/public/swagger.json (served under `https://api.bunny.net/mc`)
- logging (2): https://logging.bunnycdn.com/docs/all/swagger.json (CDN request logs, read-only, same `AccessKey` header)

Every mutation asks for approval.

## Auth

- API key: the account API key, sent in the `AccessKey` header. Copy it from the bunny.net dashboard under Account Settings > API Key (https://dash.bunny.net/account/api-key).

bunny.net offers no OAuth for third-party apps.

## Known gaps

- Stream (`video.bunnycdn.com`) and Edge Storage file APIs use a per-video-library or per-storage-zone key rather than the account key, so they are not included. Their management (creating libraries and storage zones) is covered by core.
- bunny.net's Database API spec is private and not included.
- Origin Errors (one operation on `cdn-origin-logging.bunny.net`, listed on bunny.net's spec index) is not mounted: it is a separate host that also accepts a JWT, and its AccessKey use is unconfirmed.
