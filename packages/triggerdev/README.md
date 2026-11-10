# Trigger.dev

Trigger tasks and manage runs, schedules, queues, batches, concurrency limits, environment variables, deployments, waitpoint tokens, sessions, errors, bulk actions and TRQL queries on Trigger.dev (Cloud, or a self-hosted instance served at api.trigger.dev only).

**Interface:** OpenAPI, Trigger.dev's official Management API description at https://trigger.dev/docs/v3-openapi.yaml (documented at https://trigger.dev/docs/management/overview). All mutations require approval.

**Auth:** one method, an API key (`secrets`, sent as a bearer token), which fills both security schemes the spec declares: `secretKey` and `personalAccessToken` (both http bearer). Paste either a secret key (dashboard, project API Keys; per environment, `tr_dev_sk_...`, `tr_prod_sk_...`, `tr_stg_sk_...`, so connect one account per environment) or a personal access token (`tr_pat_...`, user-scoped, needed by the seven PAT operations such as environment variables and listing project runs). Each operation accepts whichever scheme the spec lists for it; a secret key will be rejected by PAT-only operations and vice versa. There is no OAuth method: the spec declares no OAuth flow.

**Known gaps:** The waitpoint callback operation (`completeWaitpointTokenCallbackV1`) declares no security in the spec, but the account key is still sent to it as a bearer token; it is a mutation and requires approval. Self-hosted instances on another hostname are not supported (the credential is limited to api.trigger.dev). There is no official remote MCP server (Trigger.dev's MCP server runs locally through `npx trigger.dev@latest mcp`), and the realtime/streaming endpoints are not in the spec.
