# Calendly

Calendly scheduling: event types, scheduled events and invitees, availability, contacts, routing forms, meeting recaps, webhooks, groups and organization management (65 tools, 22 of them mutations that need approval).

**Interface:** OpenAPI, from Calendly's official document at https://developer.calendly.com/openapi/calendly-api.yaml, mounted live against https://api.calendly.com. The document declares the `oauth2` and `personal_access_token` bearer schemes, which this package maps to the two auth methods. Calendly also hosts an MCP server at https://mcp.calendly.com; it was not chosen because the REST API has more tools.

**Auth**

- Personal access token (`apiKey`): create one at https://calendly.com/integrations/api_webhooks.
- OAuth (`oauth`): register an OAuth app in the Calendly developer portal (https://developer.calendly.com), enter its client ID and secret on the connect page, and add the Executor redirect URI shown there as a redirect URI of the app. Authorization is at `https://auth.calendly.com/oauth/authorize` and tokens at `https://auth.calendly.com/oauth/token`. Client credentials are sent to the token endpoint with HTTP Basic auth (`client_secret_basic`), as Calendly documents for web clients. Note: Calendly's discovery document (`calendly.com/.well-known/oauth-authorization-server`) lists `https://calendly.com/oauth/token` with auth method `none`, which differs from the `auth.calendly.com` URLs in the vendor's task docs; this package follows the task docs. Calendly recommends PKCE (S256) for all apps; this package relies on the framework's OAuth handling for that. The token exchange has not been verified against the live endpoint. All documented scopes are requested except `data_compliance:write` (invitee data deletion) and `activity_log:read`.

**Known gaps:** `activity_log:read` (activity log, Enterprise plan only) and `data_compliance:write` (invitee data deletion) are not requested for OAuth, so those tools only work with a personal access token. Some endpoints require paid plans or organization admin roles.
