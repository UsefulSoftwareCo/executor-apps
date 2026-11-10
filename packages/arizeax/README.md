# Arize AX

Arize AX is an AI observability and evaluation platform. This package exposes its REST API: projects, spans, datasets and examples, experiments, evaluators, prompts, annotation configs and queues, AI integrations, spaces, users, roles, API keys and audit logs.

**Interface:** OpenAPI. Arize's official document is served at <https://api.arize.com/v2/spec.yaml> (the file behind <https://api.arize.com/v2/docs>). Tools are generated from it at runtime; every mutation requires approval.

**Auth:** API key. Create a [user API key](https://arize.com/docs/ax/security-and-settings/api-keys) or a [service key](https://arize.com/docs/ax/security-and-settings/service-keys) in Arize AX and paste it into the connect page; the REST API accepts either. It is sent as `Authorization: Bearer <key>`. Arize's REST docs describe only API-key auth, so no OAuth is declared.

**Known gaps:** Only the global host `api.arize.com` is allowed. Accounts on regional endpoints (`api.eu-west-1a.arize.com`, `api.ca-central-1a.arize.com`) or custom hosts are not supported yet. The GraphQL API and the Phoenix (open-source) API are separate products and not included. Many endpoints are labeled beta by Arize.

**Alternative:** Arize also ships an official hosted MCP server for AX (<https://api.arize.com/mcp>, alpha, Bearer API key; see <https://arize.com/docs/ax/set-up-with-ai-assistants>). This package uses the OpenAPI spec instead because it covers far more operations.
