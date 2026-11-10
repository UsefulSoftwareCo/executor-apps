# LILT

Translation and localization with LILT: machine translation, translation memories and termbases, segments, jobs, projects, documents, files, uploads, LILT Create content, webhook configuration and API keys.

## Interface

LILT's official OpenAPI 3.0.3 document, `https://support.lilt.com/api-reference/openapi-bundled.yaml` (linked from https://support.lilt.com/llms.txt), server `https://api.lilt.com`. It generates 71 tools (41 mutations, each needing approval), none skipped.

LILT also runs a remote MCP server at `https://mcp.lilt.com/mcp` (OAuth with dynamic client registration, about 9 workflow tools). It is not mounted: it needs a separate OAuth login and, as far as the listing shows, covers a subset of what the REST API exposes.

## Auth

API key (requires LILT's Business plan). Create it in the LILT web app under the account's API settings. Executor sends it as HTTP Basic auth with the key as both username and password, as the spec describes. The spec's query-parameter `key` scheme is dev-only and is not used. Health check: `GET /v2/memories` (the read-only `getMemory` operation without an id).

## Gaps

No OAuth. File upload and download operations carry binary or multipart bodies and may be awkward through generated tools.
