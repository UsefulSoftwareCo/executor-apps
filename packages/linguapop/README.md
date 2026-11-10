# Linguapop

Linguapop is a web platform for schools and organizations to run language placement tests (English, German, Spanish, Italian, French). This package lists the available test languages and creates (optionally emails) test invitations.

**Interface:** hand-written tools over the documented HTTP API at https://docs.linguapop.eu/api/ (base `https://app.linguapop.eu/api/actions/`). Linguapop publishes no OpenAPI document or MCP server. Tools: `getLanguages`, `sendInvitation`.

**Auth:** an Integration API key (`apiKey`). An Organization admin creates it in Linguapop under Integrations; each integration has its own key. The API takes the key in the JSON body of `sendInvitation`, not in a header; the package injects it. There is no OAuth.

**Known gaps:** the API has no endpoint to fetch results. Results are pushed to the `callbackUrl` given when the invitation is created. `getLanguages` needs no key and `sendInvitation` creates data, so the account health check only confirms the API is reachable and cannot validate the key.
