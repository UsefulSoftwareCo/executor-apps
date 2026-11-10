# Phrase

Phrase Strings localization: projects, locales, keys, translations, uploads, jobs, glossaries, webhooks, branches, orders and more (283 tools, 178 of them mutations that ask for approval).

Interface: OpenAPI, from Phrase's official document at https://raw.githubusercontent.com/phrase/openapi/master/doc/compiled.json (docs: https://developers.phrase.com/en/api/strings/). The spec lists two servers, so the account asks for a region and the tools are built against that data center.

Auth: access token (`apiKey`). Create it in Phrase Strings under Profile settings > Access tokens, and pick the scopes you need. Enter the region the account lives in: `eu` (api.phrase.com) or `us` (api.us.app.phrase.com). The token is sent as `Authorization: token <token>`.

Known gaps: no OAuth (Phrase offers no user-created OAuth apps for the Strings API), and no Basic auth. 18 operations are skipped because their schemas are unresolved references. Other Phrase products (TMS, Orchestrator) use different APIs and are not covered.
