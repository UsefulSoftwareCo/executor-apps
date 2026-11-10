# Customer.io

Customer.io's App API: customers and segments, campaigns, broadcasts, newsletters, transactional messages (email, push, SMS, in-app), exports, collections, reporting webhooks, workspaces and more. 195 tools, mutations require approval.

## Interface

OpenAPI, compiled live from Customer.io's official reference document: https://docs.customer.io/openapi.json (the document is shared by the App and Track APIs; only the App API origin, `https://api.customer.io`, is mounted).

## Auth

- **App API key** (`apiKey`): create one in Customer.io under Settings > Account Settings > API Credentials > App API Keys (https://fly.customer.io/settings/api_credentials?keyType=app). It is sent as a bearer token. Customer.io offers no OAuth for this API.

## Known gaps

- Track API endpoints (`track.customer.io`, Basic auth with Site ID and Track API key; 15 operations for identify, events and device registration) are not mounted: they use a different host and credential. The 3 other skipped operations span multiple hosts.
- EU-region workspaces use `api-eu.customer.io`; this package targets the US host `api.customer.io` only.
