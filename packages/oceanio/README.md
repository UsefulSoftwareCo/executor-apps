# Ocean.io

Ocean.io GTM intelligence: autocomplete, search, lookup and enrich companies and people, reveal emails and phones, read credit balance and data fields, run segmentation, manage exclusion lists, and read social posts and reactions.

**Interface:** OpenAPI, Ocean.io's official document at https://api.ocean.io/openapi.json (36 tools). The document declares no security scheme or per-operation security, so `openapi.ts` defines the `x-api-token` apiKey scheme and applies it to every operation with `fallbackSecurity`; the account token is injected from the connection. The spec also lists optional `apiToken` (query) and `x-api-token` (header) parameters on each operation; they stay in the tool input as optional fields (the framework cannot patch array parameters), should be left empty, and sending both token forms makes Ocean.io return 400.

**Auth:** API token only (`secrets`). Ocean.io offers no user-created OAuth apps. Generate the token in the Ocean.io app under API settings (see https://docs.ocean.io). The health check reads `/v2/credits/balance`.

**Approvals:** every POST/PATCH/DELETE asks for approval. Many Ocean.io search and lookup endpoints are POST, so they prompt even though they only read; reveal endpoints spend credits.

**Known gaps:** none known; all 36 operations compile.
