# Hover

Hover (hover.to) turns smartphone photos of a property into 3D models and measurements. This package exposes jobs, capture requests, deliverable change requests, measurements (JSON, XML, PDF, XLSX, ESX, SKP), images and wireframes, job shares, notes, webhooks, wallets and users.

## Interface

OpenAPI, from Hover's official REST API definition published through the ReadMe API registry behind https://developers.hover.to (`https://dash.readme.com/api/v1/api-registry/r1vno9hml86psuk`). Requests go to `https://hover.to` only (the OpenAPI servers list hover.to, sandbox.hover.to and ehi.hover.to). Credentials are not sent to `https://api.hover.to`, which also answers but is not in Hover's published spec. The health check calls List Organization Tree (`/api/v2/orgs/administered`), which needs no user id. Hover also runs sandbox (`sandbox.hover.to`) and EHI hosts; only production is mounted. Every mutation asks for approval.

## Auth

OAuth 2.0 authorization code only; Hover has no personal API keys. Hover issues a client ID and secret per integration (see https://developers.hover.to/docs/creating-and-managing-integrations). Enter them on the connect page, and register Executor's callback URL as the redirect URI of that integration. Authorize URL `https://hover.to/oauth/authorize`, token URL `https://hover.to/oauth/token`, client credentials sent as JSON body parameters (`client_secret_post`, `tokenRequestFormat: "json"`), as Hover's token and refresh endpoint docs show. Hover access tokens last 2 hours and are renewed with the refresh token, which also takes client_id and client_secret in the body. The framework always sends a PKCE challenge and verifier (it has no switch), which Hover's Doorkeeper-style server should accept alongside the client secret, though this is unverified without a real integration. Hover defines no scopes.

## Known gaps

The spec has no declared security on most operations, so bearer auth is applied to every tool. Org-level tokens need `current_user_id` or `current_user_email` on some job-creating calls. Binary downloads (images, PDFs) are returned as the API returns them. Hover's own hosted MCP (`https://developers.hover.to/mcp`) is a docs and request helper, not used here.
