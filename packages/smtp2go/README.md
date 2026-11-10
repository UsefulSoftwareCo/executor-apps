# SMTP2GO

Sends email and SMS through SMTP2GO and manages sender domains, single sender emails, SMTP users, API keys, IP auth, allowed senders and recipients, templates, webhooks, suppressions, subaccounts, email archive, activity search and statistics.

**Interface:** custom tools written with `fetch` against the official SMTP2GO API v3 at `https://api.smtp2go.com/v3` (the regional hosts `us-`, `eu-` and `au-api.smtp2go.com` are also declared). SMTP2GO publishes no downloadable OpenAPI document: its ReadMe docs at https://developers.smtp2go.com embed one OpenAPI fragment per endpoint. This package exposes all 69 operations documented there (`email.send`, `email.batch`, `email.mime`, `sms.send`, `template.*`, `webhook.*`, `domain.*`, `stats.*` and so on), each taking the documented JSON request body as `body`; the field names are listed in each tool description. Operations that only read or search are queries, everything else needs approval. The vendor's remote MCP server (`https://developers.smtp2go.com/mcp`) only offers four generic endpoint-search and request tools, so it is not used.

**Auth:** API key, sent in the `X-Smtp2go-Api-Key` header. Create one in the SMTP2GO app at https://app.smtp2go.com under Sending > API Keys; its endpoint permissions limit which tools work. SMTP2GO has no OAuth. The health check calls `api_keys/permissions`, which every key may use.

**Known gaps:** request bodies are not schema-validated locally; the API validates them. Requests go to the global endpoint, which picks a region automatically.

**Icon:** the stylised "2" from SMTP2GO's own logo SVG (https://files.readme.io/53ccbc8-smtp2go-api-documentation.svg), cropped from the wordmark in the brand blue, because the vendor publishes no standalone mark.
