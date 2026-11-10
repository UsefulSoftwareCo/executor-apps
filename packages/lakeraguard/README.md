# Lakera Guard

Screen LLM prompts, responses and tool calls for prompt attacks, data leakage and unsafe content with Lakera Guard, and manage guardrail policies and projects, logs and analytics.

Interface: OpenAPI, two official documents mounted under one provider. `guard` is the Guard API (https://docs.lakera.ai/openapi/guard-api.json, https://api.lakera.ai): screen content, fetch results, lint and check policies. `platform` is the Platform API (https://docs.lakera.ai/openapi/platform-api.json, https://platform.lakera.ai/api): policies, projects, logs and analytics. The four deprecated `/v1-beta/policies` operations are removed with `patches` because the spec says they return 410 Gone (retired with Policies V2); `/v1/policies` is mounted. Screening, result lookup, policy health and lint checks, log and analytics calls are queries; creating, updating and deleting policies and projects ask for approval.

Auth: API key (`apiKey`), sent as a bearer token. Create it at platform.lakera.ai/account/api-keys (the "API Access" page, "+ Create new API key"). A read-only key works for reads (logs, analytics, GET endpoints); write endpoints need a read and write key. Lakera does not offer user-created OAuth apps.

Known gaps: the Guard API also has regional hosts (eu, us, ap-southeast-1); this package uses the default `api.lakera.ai`. The Lakera docs MCP server is documentation only and is not mounted.
