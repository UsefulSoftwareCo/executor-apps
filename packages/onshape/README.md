# Onshape

Cloud CAD: documents, workspaces, versions and branches, part studios, assemblies, drawings, metadata, exports and translations, releases, teams, users and webhooks.

Interface: OpenAPI. Onshape's official OpenAPI 3 document is served at https://cad.onshape.com/api/openapi (API v17) and is read live. Every mutation requires approval.

Auth:
- API key: create an access key and secret key in the Onshape developer portal (https://dev-portal.onshape.com/keys). Sent as HTTP Basic.
- OAuth: register an OAuth application in the developer portal (https://dev-portal.onshape.com/oauthApps), set the redirect URI to the one Executor's connect page shows, and enter its client ID and secret. Requested scopes: OAuth2Read, OAuth2Write, OAuth2Delete, OAuth2ReadPII.

Known gaps: only cad.onshape.com is allowed; enterprise accounts on a custom Onshape host (for example company.onshape.com) are not covered. Operations in the spec's Atlas/enterprise-admin scopes need an application with those scopes granted.

Note: the published document puts OAuth2 and BasicAuth in one security requirement (meaning both at once), so `openapi.ts` patches each secured operation to accept either. `secured-operations.json` lists the patched operations; regenerate it if the spec adds endpoints.
