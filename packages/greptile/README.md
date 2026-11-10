# Greptile

Greptile is an AI code review service for GitHub and GitLab. This package exposes Greptile's official remote MCP server (`https://api.greptile.com/mcp`): repository knowledge bases, pull requests and code reviews, review comments, triggering reviews, custom context and review analytics. The "Greptile MCP" catalog target is this same product.

## Interface

Official remote MCP server, https://api.greptile.com/mcp. Greptile publishes no public OpenAPI or GraphQL spec.

## Auth

OAuth 2.0 only. The server advertises its metadata at `https://api.greptile.com/.well-known/oauth-protected-resource/mcp` (authorization server `https://auth.greptile.com`, which advertises a `registration_endpoint`, so dynamic client registration is available and no OAuth app needs to be created by hand; Greptile's docs say "You do not need to register an OAuth client"). Executor supplies its own redirect URI when it registers; Greptile's docs do not document a redirect URI. Credentials go to `api.greptile.com` and `auth.greptile.com` (both in `hosts`).

Scopes requested: `read` and `offline_access`. The authorization server's metadata lists `scopes_supported` as `offline_access`, `offline`, `openid`, `read`; `write` appears only in the protected-resource metadata. Requesting an unadvertised scope could fail sign-in with `invalid_scope`, and Greptile does not document `write`, so it is not requested. If write tools are rejected after sign-in, adding `write` to the scopes in `index.ts` is the follow-up change once Greptile confirms it is accepted.

No API key method is offered. Greptile's current MCP docs (https://www.greptile.com/docs/mcp/authentication, https://www.greptile.com/docs/mcp-v2/setup) say MCP uses OAuth and mention no API key, and that a static `Authorization` header can block OAuth sign-in. Older docs and integrations.sh describe a Bearer API key from Settings > Organization > API Keys; that path is not offered here.

## Gaps

Tools are whatever the server lists after sign-in (a count of 21 is unverified). Non-read-only tools require approval. Accounts in more than one Greptile organization get a `tenant_required` error until the agent calls `get_me` to list organizations and passes the organization handle or id as the `organization` argument on later tool calls (per https://www.greptile.com/docs/mcp-v2/setup). Write scope is unconfirmed (see Auth).
