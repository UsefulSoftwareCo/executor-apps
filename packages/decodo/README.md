# Decodo

Decodo (formerly Smartproxy) residential proxy account management: sub-users and their traffic, whitelisted IPs, proxy endpoint lists and generators, the subscription, and dashboard traffic and target statistics.

**Interface:** OpenAPI, from the vendor's two official documents, mounted under separate keys of one router:

- `api`: https://help.decodo.com/api-reference/jero_public_api.yaml (base `https://api.decodo.com`)
- `statistics`: https://help.decodo.com/api-reference/jero_dash_stats.yaml (base `https://api.decodo.com/api/v2/statistics`; its two POST operations only read and run without approval)

**Auth:** API key. Create a Public API key in the Decodo dashboard under Settings, API Keys (https://dashboard.decodo.com/profile?tab=api-keys); it is shown once. The key is sent as the raw `Authorization` header. Decodo offers no OAuth for this API.

**Known gaps:** the Public API does not cover datacenter or ISP proxies, and mobile proxies only support the traffic and targets statistics. The Web Scraping API (separate credentials, scraper.decodo.com) is not included. The vendor's example responses are not valid JSON, so the health check only verifies that `GET /v2/subscriptions` returns a JSON body.
