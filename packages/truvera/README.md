# Truvera

Issue, manage and verify verifiable credentials and decentralized identities with Truvera (formerly Dock): DIDs, credentials, schemas, registries, proof templates and requests, profiles, templates, keys, messaging, OpenID credential offers, teams and sub-accounts.

Interface: OpenAPI, from the vendor's official document at https://swagger-api.truvera.io/openapi.yaml (151 tools, 82 mutations needing approval). Requests go to the production API at `https://api.truvera.io`.

Auth: API key. Create one in the Truvera Workspace (https://truvera.io/) under API keys; it is sent as `Authorization: Bearer <key>`. Truvera does not offer user-created OAuth apps.

Known gaps:
- The vendor's OpenAPI description says keys created in test mode are used with the sandbox server `https://api-testnet.truvera.io` (the Workspace key docs do not mention this). This package only targets production, so use a live-mode key.
- 3 operations are left out because they need other security schemes: `POST` and `PUT /delegatable-revocations/{registryId}` (create or update delegatable revocation status; `sponsorKey` + `didKeyAuth`), `POST /data/onboarding` (`nextAuth`), and `POST /keys/temporary-key` (an internal temporary-key route; `nextAuth`).
- `GET /openid/vp/{id}/authorize` is left ungated: per the spec it only returns a 302 redirect to the authorization URL for a proof request and does not submit a presentation.
