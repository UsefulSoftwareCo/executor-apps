# Momentum.io

Momentum.io revenue intelligence: list meetings, remap meetings to Salesforce objects, list organization users, and read AI signal (v1 and v2) definitions and executions.

Interface: Momentum's official OpenAPI document, https://docs.momentum.io/api/openapi-spec.yaml (base URL https://api.momentum.io), loaded live.

Auth: API key only (Momentum has no OAuth). The workspace must have API access enabled by Momentum support; then create a key under Integrations > Create API key in the Momentum dashboard. It is sent as the `X-API-Key` header. Requests are rate limited to 100 per 15 minutes.

Known gaps: "Ingest a meeting from any source" (`POST /v1/user-provided-meeting`) is served from a different origin, receiver.momentum.io, and is skipped because a package allows one origin.
