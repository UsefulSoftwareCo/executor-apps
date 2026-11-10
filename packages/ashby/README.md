# Ashby

Recruiting and applicant tracking with Ashby: candidates, applications, jobs, openings, interviews, offers, notes, custom fields, sources, users, reports and more (201 endpoints).

## Interface

Ashby's official API at `https://api.ashbyhq.com` (RPC-style: every endpoint is a `POST /<resource>.<action>`). Ashby publishes no combined OpenAPI file; its reference site (https://developers.ashbyhq.com/reference) embeds one OpenAPI 3.1 definition per endpoint. `document.json` is those official definitions merged into one document (fetched from the `.md` form of each page listed in https://developers.ashbyhq.com/llms.txt). Endpoints that Ashby describes as "Implemented by Partner" (`assessment.start`, `assessment.list`, `assessment.cancel`, `customFields.fetch`) are left out because partners implement them and Ashby calls them. Webhook payload schemas are not exposed as tools.

Because every operation is a POST, endpoints named `info`, `list*`, `search*`, `get*`, `generate` and `synchronous` are treated as read-only queries; everything else is a mutation and asks for approval.

## Auth

API key. Create one in Ashby under Admin > Integrations > API Keys (https://app.ashbyhq.com/admin/api/keys) and grant it the permissions for the endpoints you need; a call without permission fails with `missing_endpoint_permission`. Ashby uses HTTP Basic auth with the key as the username and an empty password. The connection check calls `apiKey.info`, so give the key the `apiKeysRead` permission. Ashby offers no OAuth for user-created apps.

## Gaps

- To refresh the tool set when Ashby changes its API, re-merge the per-endpoint definitions into `document.json`.
- Webhooks are not covered.

## Health check

The health check POSTs `apiKey.info` and relies on the HTTP status (Ashby signals bad keys with 401/403); it does not inspect `success: false` in the body. The key needs the `apiKeysRead` permission.
