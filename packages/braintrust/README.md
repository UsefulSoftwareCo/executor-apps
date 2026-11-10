# Braintrust

Braintrust is an AI observability and evaluation platform. This package exposes its REST API: projects, experiments, datasets, prompts, functions and scorers, project logs, tags, views, access control (ACLs, groups, roles), users and organizations, AI secrets and environment variables.

Interface: OpenAPI 3 document published by Braintrust at https://github.com/braintrustdata/braintrust-openapi (`openapi/spec.json`), served against https://api.braintrust.dev. Braintrust also runs an official MCP server at https://api.braintrust.dev/mcp (OAuth); it is not mounted because the REST API covers it.

Auth: API key only. Create one in Braintrust under Settings > API keys (https://www.braintrust.dev/app/settings?subroute=api-keys) and paste it as the key. Braintrust offers no user-created OAuth apps for the REST API, so there is no OAuth method.

Known gaps: mutations require approval. Only the US region (https://api.braintrust.dev) is supported; the host is fixed. Organisations in the EU region (https://api-eu.braintrust.dev) and self-hosted data planes cannot connect. The 71 CORS preflight `OPTIONS` operations in the spec are removed so only the real API operations (163) are exposed.
