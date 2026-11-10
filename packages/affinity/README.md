# Affinity

Affinity relationship-intelligence CRM: companies, persons, opportunities, lists and list entries, notes, interactions (emails, calls, meetings, chat messages), field data, files, merges and relationship scores. 114 tools (34 mutations, all requiring approval).

**Interface:** OpenAPI, Affinity's official API v2 document at https://developer.affinity.co/api-reference/openapi.json (dated version 2026-09-17). Some endpoints are marked BETA by Affinity.

**Auth:** API key (bearer token). Create one in Affinity under Settings > Manage Apps > "Generate an API key"; this needs the "Generate an API key" role-based permission from your Affinity admin. The key can also be restricted with an IP allowlist.

**Known gaps:**
- OAuth 2.0 is declared in the spec (`login.affinity.co`, scopes `api`, `api.read`, `offline_access`) but Affinity documents no self-service OAuth app registration for the REST API, so only the API key is offered.
- The legacy v1 API (`api.affinity.co` basic auth, no OpenAPI document) is not covered.
