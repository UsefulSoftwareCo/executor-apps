# Justworks

Company, members, payroll, paystubs, deductions, time off and subscriptions from the Justworks partner API (26 tools, 7 of them writes that always ask for approval).

**Interface:** OpenAPI. Justworks' official OpenAPI 3.0 document (v1.36.3) is published only as the Redoc page at https://public-api.justworks.com/v1/docs, with no standalone spec URL, so `spec.ts` embeds the document extracted from that page. The OAuth token/revoke endpoints and the image path are removed because the framework handles them. Re-extract it when Justworks releases a new version.

**Auth:** OAuth 2 authorization code only. Justworks does not let customers create OAuth apps: it creates them for approved partners (email partner-api@justworks.com with the app name, redirect URI and scopes). Once you have a client ID and secret, enter them on the connect page; the redirect URI must be the Executor callback URL you gave Justworks. Authorization is at https://payroll.justworks.com/oauth/authorize, tokens at https://public-api.justworks.com/oauth/token. All 20 documented scopes are requested; a tool needs its own scope on the app.

**Known gaps:** No API-key option exists. The OAuth endpoints are not exposed as tools.
