# GenderAPI.io

Predict gender (with confidence) from a name, email address or username, run ordered batches of up to 50 lookups, validate and format phone numbers, and check account usage and the error catalog.

## Interface

The vendor's official OpenAPI 3.1 document, https://api.genderapi.io/api/v2/openapi.json (API v2, host `api.genderapi.io`). `POST /gender`, `/gender/batch` and `/phone/validate` are exposed as mutations, so they require approval (they also spend credits).

## Auth

API key (`apiKey`), sent as `Authorization: Bearer <key>`. Copy the 24-character key from your account at https://app.genderapi.io. There is no OAuth. V1 and v2 share the same key and balance.

## Gaps

- A missing or unknown key does not return an error; the API silently falls back to a shared IP trial (10 credits per day). The health check therefore cannot detect a wrong key; check `meta.access.mode` is `api_key` in a `usage` response.
- Only the Bearer scheme is configured, not the `key` query parameter.
