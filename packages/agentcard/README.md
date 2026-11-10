# Agentcard

Agentcard lets an agent buy things online with a user's vaulted card. This package covers the platform side of the Agentcard v2 API: introspecting your credential, connecting users (send and verify a one-time code, record consent, refresh the connection) and KYC identity verification (document uploads, extra information, status, import).

**Interface:** OpenAPI 3.1, Agentcard's official document at https://docs.agentcard.sh/openapi.json (12 tools, 10 of them mutations that always ask for approval).

**Auth:** OAuth2 client credentials. In the Agentcard dashboard open Organization, Developer, Credentials and create a client; enter its client ID and client secret when connecting. Executor exchanges them at `https://api.agentcard.sh/api/v2/oauth/token` for one-hour platform tokens. A sandbox client acts in sandbox and a production client in production; there is a single host, `api.agentcard.sh`. No redirect URI is involved.

**Known gaps:** the card and purchase operations (`/api/v2/cards*`, `/buy*`, `/api/v2/flow_status`) authenticate with a per-user access token returned by the connect flow, not the platform token. Executor skips them (9 operations, reason `auth_method`).
