# Drata

Drata compliance automation through the public API v2: users, personnel and devices, assets, controls, policies, risks, vendors, evidence, monitoring tests, frameworks, custom fields and custom connections (234 operations, 112 of them mutations).

## Interface

OpenAPI, from Drata's own API v2 reference at [developers.drata.com](https://developers.drata.com/openapi/reference/v2/overview/). Drata publishes no stable URL for the file (the page's "Download OpenAPI specification" link is generated in the browser), so `openapi.json` is that definition bundled unchanged and compiled from the package.

## Auth

API key. In Drata, open Settings, API Keys, Create API Key, choose the scopes the tools should have, and copy the key (it is shown once). API access needs Drata's Advanced plan or higher, and a key only works in its own workspace. Requests go to `https://public-api.drata.com/public/v2` with `Authorization: Bearer <key>`. Mutations always ask for approval.

The health check lists one user and treats 403 as authenticated, since a key scoped away from personnel is still valid.

## Known gaps

- Only the US region (`public-api.drata.com`) is used. The EU (`public-api.eu.drata.com`) and APAC (`public-api.apac.drata.com`) hosts are in the definition but not offered.
- Drata also supports OAuth, but only as a client-credentials grant against a per-tenant auth domain, which the OAuth setup here does not cover; use an API key.
