# Weights & Biases

Experiment tracking on Weights & Biases: projects, runs, sweeps, artifacts and
collections, reports, automations, teams (entities) and organizations. Every
query and mutation of the W&B GraphQL API becomes a tool; mutations require approval.

Interfaces, both mounted per account:

- `graphql`: `https://api.wandb.ai/graphql` (the API behind the `wandb` SDK;
  introspection is open, so the tool catalog follows the live schema and the
  count is not fixed). Mutations require approval.
- `mcp`: the official hosted W&B MCP server, `https://mcp.withwandb.com/mcp`
  (source: https://github.com/wandb/wandb-mcp-server). It is mounted because it
  adds things GraphQL does not reach: Weave trace and evaluation queries, run
  diagnosis and comparison, docs search and report creation. Tools without a
  `readOnlyHint` require approval. The probe returns 401 without credentials,
  so the Bearer scheme is taken from the server's README.

Auth: API key. Create one at https://wandb.ai/authorize (or User settings > API keys).
GraphQL: HTTP Basic with user name `api` and the key as password. This matches
the wandb SDK, which sends `auth=("api", api_key)` on its GraphQL session
(https://github.com/wandb/wandb/blob/main/wandb/sdk/internal/internal_api.py;
docs.wandb.ai now redirects to an access-gated CoreWeave page, so the SDK source
is the checkable reference). MCP: `Authorization: Bearer <key>`
(https://github.com/wandb/wandb-mcp-server#readme). The health check reports a
clear error for 401/403 and for a null `viewer`. Only the public cloud
(`api.wandb.ai`) is targeted, not Dedicated/Self-Managed deployments.

Known gaps: Serverless Inference (`api.inference.wandb.ai/v1`) and Training
(`api.training.wandb.ai/v1`) are separate OpenAI-style products on their own
hosts that bill per call and are used from model code, not for managing W&B
data; they are deliberately not mounted. The GraphQL schema is not a stable
documented contract; some operations are internal to the W&B app.
