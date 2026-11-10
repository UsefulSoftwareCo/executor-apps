# Runpod

Manage Runpod GPU cloud through the v2 API: pods (create, start, stop, restart, update, delete, logs), clusters, serverless endpoints and workers, builds and releases, templates, network volumes, catalog, secrets, SSH keys, container registry auth and delegations, and billing history.

**Interface:** OpenAPI 3.1. Source: Runpod's official v2 API document at https://api.runpod.io/v2/openapi.json (docs: https://docs.runpod.io/api-reference). All operations are on `https://api.runpod.io`. The compile yields 58 tools (24 mutations, 0 skipped) from the document's 60 operations. Every mutation requires approval. Runpod's REST v1 (`rest.runpod.io/v1`) is deprecated and retires on 2026-11-15, so this package uses v2 only.

**Auth:** API key only (the API does not offer OAuth). Create one in the Runpod console under Settings > API Keys (https://console.runpod.io/user/settings), with read/write or restricted permissions. It is sent as a bearer token (`bearerAuth`).

**Health check:** `GET https://api.runpod.io/v2/account/ssh-keys`, status only. A 401 reports a rejected key; a 403 reports a valid key that lacks permission to read SSH keys, which does not affect other resources.

**Known gaps:** The Runpod GraphQL API (https://api.runpod.io/graphql) and serverless endpoint invocation (host `api.runpod.ai`, `/v2/{endpoint_id}`) are not included. Runpod's official hosted API MCP server (https://mcp.getrunpod.io/, Streamable HTTP, OAuth) is a different interface and is not included.
