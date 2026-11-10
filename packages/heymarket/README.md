# Heymarket

Business texting with [Heymarket](https://www.heymarket.com): send SMS, MMS and email, manage contacts and contact lists, work conversations, read inboxes, users, templates, scheduled sends and tracked links.

**Interface:** Heymarket's official OpenAPI 3.1 document, https://developers.heymarket.com/api-reference/openapi/heymarket-openapi-3.1.2.yaml (86 tools, no skipped operations). Base URL `https://api.heymarket.com`. Every mutation requires approval. Heymarket also hosts a beta MCP server at `https://mcp.heymarket.com/mcp` that uses per-user Personal Access Tokens; it is not mounted because the REST API covers more.

**Auth**

- API Secret (recommended): in Heymarket go to Settings > Integrations > API (https://app.heymarket.com/admin/integrations/api) and generate an API Secret. Enter the Secret ID and Secret Key (the key is shown only once). The app signs a fresh short-lived HS256 JWT (`iss` = Secret ID, key `<Secret ID>||<Secret Key>`) for every request.
- Legacy team API key: a static bearer key. Heymarket plans to deprecate it.

There is no OAuth for third-party apps.

**Known gaps:** none from the spec. Some read-style operations are POSTs (searches, bulk lookups) and are therefore approval-gated as mutations.
