# Dock Certs

Issue, verify and revoke verifiable credentials with Dock Certs. Dock rebranded
to Truvera; the product and its API now live at truvera.io. The package covers
DIDs, credentials, schemas, registries, revocation, presentations and proof
requests, templates, profiles, teams, sub-accounts, jobs and webhooks.

**Interface:** OpenAPI 3, the vendor's own document at
https://swagger-api.truvera.io/openapi.yaml (linked from the Truvera docs).
151 tools; every mutation requires approval.

**Auth:** API key. Create it in the Truvera Workspace (https://truvera.io/keys,
"Create API key"); the key is sent as a Bearer token (the API also accepts the
`DOCK-API-TOKEN` header). Production keys call https://api.truvera.io.

**Known gaps:**
- Test-mode keys belong to https://api-testnet.truvera.io; this package targets
  production only.
- Three wallet-facing operations are left out because their security schemes
  (`CERTS-TOKEN`, `X-MOBILE-SPONSOR-KEY`, `nextAuth` session tokens) are not
  API keys: `POST /delegatable-revocations/{registryId}`, `POST /data/onboarding`
  and `POST /keys/temporary-key`. API-key integrations do not use them.
- The OpenID issuer/verifier redirect endpoints (`/openid/.../authorize`,
  `/callback`) are browser flows and are exposed as plain GET tools.

**Icon:** the product mark is the dot-cluster logo from the truvera.io site
header (inline SVG, mark only, without the wordmark); the white dots are drawn
near-black on light backgrounds.
