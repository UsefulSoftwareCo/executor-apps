# Dub

Manage Dub (dub.co) short links, bulk link operations, tags, folders, domains, analytics and events, conversion tracking (leads, sales), customers, partner programs, commissions, payouts, bounties and QR codes.

**Interface:** OpenAPI, Dub's official document at https://dub.co/openapi.json (API at https://api.dub.co).

**Auth**
- API key: create one in a workspace under Settings > API Keys (https://app.dub.co/settings/tokens; see https://dub.co/docs/api-reference/authentication#api-keys) and paste it in. API-key accounts get all 57 tools.
- OAuth 2.0: create an OAuth app under Settings > OAuth Apps (https://app.dub.co/settings/oauth-apps), set Executor's callback URL shown on the connect page as the redirect URI (it must exactly match the redirect URI registered in the OAuth app), then enter the client ID and secret. Requested scopes: links, tags, domains and folders read/write, plus analytics.read.

**Known gaps:** OAuth accounts get 33 tools (links, bulk links, upsert, analytics/events, tags, folders, domains, QR); the partner, program application, discount code, customer, commission, payout, bounty, tracking and embed-token operations are removed for OAuth because the scopes do not cover them, and need an API key (57 tools). The health check uses GET /tags (works with both API keys and OAuth tokens). Dub recommends PKCE, which the framework does not support, so the client-secret flow is used. Mutations require approval.
