# Storyblok

Manage a Storyblok space (stories, components, assets, datasources, webhooks, workflows and more) through Storyblok's official hosted MCP server at https://mcp.labs.storyblok.com/mcp. The server wraps the full Management API behind search, describe and execute tools. Storyblok has no public OpenAPI document (its specs live in a private repository), so MCP is the best official interface. The server exposes 7 tools: `search`, `describe`, `execute_readonly`, `execute_mutating`, `execute_destructive`, `upload_asset` and `upload_asset_finish`. The server is labelled "Innovation phase" by Storyblok.

## Auth

- Personal access token: create one under My account > Account settings > Personal access tokens in Storyblok (all spaces or selected spaces). It is sent as `Authorization: Bearer <token>`.
- OAuth: not offered. The hosted MCP advertises no OAuth metadata, so only the personal access token is supported here. Storyblok documents its OAuth flow for plugins (Tool Plugins and Space Plugins).
- Account check: the server answers discovery without credentials, so the check calls `execute_readonly` with `getCurrentUser` using the token, trying regions eu, us, ca, ap and cn in turn (the account has no region). Region-dependent operations take a `region` argument at call time.

## Gaps

- The Content Delivery API (per-space public/preview tokens) and the GraphQL delivery API are not covered.
- Mutating tools always require approval.
- `upload_asset` returns a signed S3 URL and suggests a `curl` upload from a shell; that step happens outside the MCP host, then `upload_asset_finish` finalizes it.
