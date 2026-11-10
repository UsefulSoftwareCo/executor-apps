# evaluagent

evaluagent contact centre quality assurance: users, groups and roles, evaluations, disputes, calibration sessions, actions and messages, one-to-ones, imported contacts, conversation analytics, feedback, work-queue templates and the Context Engine knowledge vault.

## Interface

evaluagent's official OpenAPI 3.0 definition (API v1.0.6), published through the Redoc page at https://docs.evaluagent.com/. The page offers the definition only as an in-browser download with no stable file URL, so `document.json` is the definition embedded in that page, unchanged except that the stray `x-stoplight` block is dropped and the `/analytics/conversations` path, whose key in the source includes example query parameters, is normalized.

Each account targets one of the three clusters: `eu` (https://api.evaluagent.com), `us-east` (https://api.us-east.evaluagent.com) or `aus` (https://api.aus.evaluagent.com), all under `/v1`.

## Auth

API key over HTTP Basic. In evaluagent open Conversations > Integrations > API, create an API key, and copy the Access Key ID (Basic username) and Secret Key (Basic password). Enter them with the region of your account. The connection check calls `GET /v1/ping`. The API also supports short-lived bearer tokens (`POST /token`), which are not used here; evaluagent offers no OAuth.

## Gaps

- Rate limits are 100 requests per minute and 10,000 per day per key and endpoint; Knowledge Vault writes are limited to 20 per minute.
- Mutations ask for approval. To refresh the tool set when evaluagent changes its API, re-extract the definition into `document.json`.
- Audio upload for imported contacts is multipart and may not be usable as a tool.
