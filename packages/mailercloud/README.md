# Mailercloud

Mailercloud email marketing: campaigns (create, update, schedule, test sends, opens/clicks/unsubscribes, domain reports), contacts and batch imports, lists, segments, tags, custom properties, templates, webhooks, automations, senders, webforms and inbox tracking, plus the Email API for transactional and personalized (mail merge) sending and suppressions.

**Interface:** OpenAPI, from Mailercloud's official documents at https://apidoc.mailercloud.com/openapi-v1.json (Marketing API, 56 tools, `https://cloudapi.mailercloud.com/v1`) and https://apidoc.mailercloud.com/openapi-emailapi.json (Email API, 6 tools, `https://email-api.mailercloud.com`), mounted as `marketing` and `email` in one router. Many Marketing API list/search/report operations are POSTs; the read-only ones are marked as queries so they run without approval. Mailercloud also hosts an MCP server (`https://mcp.mailercloud.com/mcp`) covering the same account; it was not added because the OpenAPI documents already cover the platform.

**Auth:** API key. Create one in Mailercloud under Account, API Integrations (https://app.mailercloud.com/account/api-integrations). It is sent as the raw `Authorization` header value (no `Bearer` prefix). Mailercloud has no OAuth for customer apps.

**Known gaps:** the Email Verifier API (`https://verify.mailercloud.com`, https://apidoc.mailercloud.com/openapi-verifier.json) is not included: it uses a separate key (created at https://app.mailercloud.com/email-verifier/api-keys) sent as a Bearer token, which does not fit the single key of this account.
