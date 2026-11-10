# Trackdesk

Trackdesk affiliate tracking: affiliates, offers and creatives, conversions, billing (open balances, settlements), tags, tiers, bonuses, clients and webhooks.

**Interface:** OpenAPI. Uses Trackdesk's official full-instance document, https://developers.trackdesk.com/api.instance.json (reference at https://developers.trackdesk.com/). The document's server is `https://{tenantId}.trackdesk.com`; the package substitutes the account's tenant. Mutations require approval.

**Auth:** personal access token (`X-Api-Key`) plus the tenant ID. Open your program (`https://<tenantId>.trackdesk.com`), click your name, Settings, then Integrations > Personal access tokens, and generate a key. The API works only while the program's plan includes the public API.

**Known gaps:** Trackdesk also supports OAuth2 (authorization code with PKCE, client credentials), but its endpoints are tenant-relative (`https://<tenantId>.trackdesk.com/oauth/authorize`, `/api/node/oauth/token`, `/api/node/oauth/revoke`) and the framework declares them statically, so only the token is offered; a later framework change could add them. The OAuth2 client-management operations (register, token, revoke, check) are removed from the tool list. The separate affiliate and advertiser documents were checked: every operation in them (method and path) also appears in the instance document, so they are not mounted. `Create conversion` and `Update conversion` are GET operations in the vendor document; they are classified as mutations and require approval.
