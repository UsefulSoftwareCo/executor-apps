# Seven.io

SMS, voice (text-to-speech) calls, RCS and WhatsApp messages, contacts and groups, phone numbers, number lookups (HLR, MNP, CNAM, format, RCS), webhooks, journal, pricing, analytics and subaccounts (51 tools, 26 mutations that require approval).

**Interface:** OpenAPI, seven.io's official schemes from the seven-io/api-schemes repository at https://raw.githubusercontent.com/seven-io/api-schemes/master/json/openapi.json. Server: `https://gateway.seven.io/api`. The document declares only OAuth 2.0; the API key is sent in the `X-Api-Key` header, which every endpoint accepts.

**Auth** (verified against https://docs.seven.io/en/rest-api/authentication and https://docs.seven.io/en/rest-api/oauth2.0)

- API key: create one in the Developer area of the seven.io dashboard (https://app.seven.io). Sent in the `X-Api-Key` header, which the authentication page documents (the spec itself only declares OAuth, so Executor adds that scheme).
- OAuth 2.0: create an app under Developer > OAuth apps, copy its client ID and secret into the connect page, and register Executor's redirect URI in the app (it must match exactly). Token requests use HTTP Basic client authentication; `https://oauth.seven.io/revoke` is documented on the OAuth page. Access tokens last one hour by default and are refreshed with the refresh token. Unreviewed apps may connect to at most 25 foreign accounts (own account and subaccounts excluded).
- Scopes: the package requests a fixed list of 16 scopes: analytics, balance, contacts, groups, hooks, journal, lookup, numbers, pricing, rcs, sms, status, subaccounts, validate_for_voice, voice, waba. All 16 are documented on the OAuth page; `groups` and `numbers` are missing from the OpenAPI document's securitySchemes but are real scopes (contacts/groups and numbers endpoints). Only scopes registered for the OAuth app can be requested (anything else is rejected with `invalid_scope`), so register all 16 on the app.

The OAuth details rest on seven.io's own docs and spec. `gateway.sms77.io` is a legacy host of the same API and is not used.

**Known gaps:** seven.io also runs a hosted MCP server (https://mcp.seven.io/mcp, "more than 40 tools" per https://docs.seven.io/en/mcp, OAuth 2.0 with PKCE). It is not mounted; the 51-operation OpenAPI is the richer interface.
