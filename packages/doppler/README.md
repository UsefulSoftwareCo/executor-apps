# Doppler

Manage secrets and config in [Doppler](https://www.doppler.com): projects, environments, configs, secrets, tags, webhooks, integrations and syncs, groups, users, service accounts and their tokens, service tokens, project members and roles, workplace roles, trusted IPs, dynamic secret leases, activity and config logs, service account identities, change requests, and Doppler Share. 136 tools (81 mutations, all requiring approval), covering every operation in Doppler's API reference.

**Interface:** OpenAPI. Doppler publishes no single OpenAPI file; each page of its API reference (<https://docs.doppler.com/reference/api>, indexed at <https://docs.doppler.com/llms.txt>) embeds the official OpenAPI definition of one endpoint. `spec.ts` is the 136 unique method+path operations found there merged into one document (response examples removed, the docs' empty oauth2 scheme replaced by bearer auth, a few operationIds renamed to readable names). It targets `https://api.doppler.com`. Doppler's experimental MCP server is stdio only (no hosted URL), so it is not used.

**Auth:** API token only. No OAuth app creation is documented by Doppler. Create a token in the dashboard and paste it in; it is sent as `Authorization: Bearer <token>`.
- Personal token (`dp.pt.`, full user access) and service account token (`dp.sa.`, workplace-wide, suited to agents): create them in the Doppler dashboard (see Doppler's token docs for the current menu location).
- Service token: a single project config, read-only or read/write (`dp.st.`); only the secrets and config endpoints for that config will work.

The health check calls `GET /v3/me`.

**Known gaps:** none in operation coverage; every operation in the reference is included. Response schemas are not modelled (responses are returned as JSON). The Doppler Share endpoints live under `/v1/share` on the same host; the share.doppler.com URLs they return never receive credentials. The `secrets-download` endpoint returns a file, not JSON. Change-request, group and other plan-gated endpoints require plans that include them.
