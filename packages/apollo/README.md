# Apollo

Search and enrich people and companies, and manage contacts, accounts, deals, sequences, tasks, calls and lists in Apollo.io. Tools are generated live from Apollo's official OpenAPI 3.1 document at https://docs.apollo.io/openapi/apollo-rest-api.json (81 operations, all on https://api.apollo.io/api/v1). Every POST, PATCH and PUT requires approval, including read-only searches (people and company search) that Apollo exposes as POST. Enrichment and some searches consume Apollo credits.

## Auth

- API key: create one in Apollo under Settings > Integrations > API Keys, see https://docs.apollo.io/docs/create-api-key. The key is sent in the `x-api-key` header. Some endpoints (for example listing users) need a master key; others return 403 if the key's scopes or your plan do not include them.

## Known gaps

- OAuth 2.0 is not offered. OAuth is for partners building marketplace integrations; the public docs do not describe a user-creatable OAuth app (see https://docs.apollo.io/docs/use-oauth-20-with-apollo).
- The official remote MCP server (https://mcp.apollo.io/mcp, OAuth) was not used because the OpenAPI document gives full REST coverage with a user-creatable API key.
- The icon is the Apollo mark taken from the SVG on apollo.io; Simple Icons has no Apollo.io entry.
