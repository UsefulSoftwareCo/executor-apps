# CaptureKit

Captures webpage screenshots (PNG, JPEG, WebP, PDF), extracts structured page content (metadata, links, HTML, Markdown), fetches raw HTML with the website crawler, and analyzes pages with AI. The package also exposes the account usage endpoint through the same server.

## Interface

CaptureKit's official remote MCP server, `https://mcp.capturekit.dev/` (Streamable HTTP, documented at https://docs.capturekit.dev/mcp). Its tools map one to one to the REST API at `https://api.capturekit.dev/v1`. CaptureKit publishes per-endpoint OpenAPI pages but no downloadable OpenAPI document, so the MCP server is the official machine-readable surface. Tools that are not marked read-only require approval.

## Auth

- API key: create one in the CaptureKit dashboard (https://app.capturekit.dev, see https://docs.capturekit.dev/api-keys). It is sent in the `x-api-key` header.
- OAuth: the server publishes protected-resource metadata and dynamic client registration with `https://app.capturekit.dev` as the authorization server, so no OAuth app needs to be created. Executor registers itself; its callback URL is used as the redirect URI.

## Known gaps

The tool list is whatever the MCP server advertises at connect time; it was not enumerated here because listing tools needs a real account. Each call costs credits on the connected account (1 credit per capture, content, crawler or analyze call; usage is free).
