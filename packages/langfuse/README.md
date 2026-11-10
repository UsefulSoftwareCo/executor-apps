# Langfuse

Langfuse LLM observability and engineering platform: traces, observations, scores, score configs, datasets and dataset runs, prompts, sessions, models, comments, annotation queues, metrics and projects.

Interface: OpenAPI, from Langfuse's official document at https://cloud.langfuse.com/generated/api/openapi.yml, bundled as openapi.json (converted from YAML because the generator rejects its YAML anchors; regenerate it to pick up API changes). The document declares no servers, so the package sets the base URL from the account's region.

## Auth

Project API keys (HTTP Basic: public key as username, secret key as password). In Langfuse open the project, then Settings, API Keys, Create new API keys. Enter the public key (`pk-lf-...`), the secret key (`sk-lf-...`) and the region of your Langfuse Cloud project: `eu` (cloud.langfuse.com), `us` (us.cloud.langfuse.com), `jp` (jp.cloud.langfuse.com) or `hipaa` (hipaa.cloud.langfuse.com). Organization-scoped keys also work for the organization endpoints. Langfuse's public API has no OAuth, so no OAuth app is offered.

## Gaps

- Self-hosted Langfuse instances are not supported: credentials are only sent to the three Langfuse Cloud hosts.
- Langfuse also offers an authenticated MCP server (https://cloud.langfuse.com/api/public/mcp); it is not mounted because the OpenAPI document covers more.
