# Skyvern

Skyvern automates browser-based workflows with AI agents. This package exposes
its cloud API: run tasks and agents, manage workflows and runs, browser sessions,
browser profiles, credentials, scripts and artifacts (94 tools, 56 mutations;
mutations require approval).

## Interface

OpenAPI, from Skyvern's official document at https://api.skyvern.com/openapi.json.
Only the cloud origin `https://api.skyvern.com` is allowed; the document's staging
and local servers are ignored.

## Auth

API key (`x-api-key` header). Create one at https://app.skyvern.com/settings.
Skyvern offers no user-created OAuth apps.

## Known gaps

Self-hosted Skyvern instances are not supported (the host is fixed to
api.skyvern.com). The icon is Skyvern's official 512px logo PNG
(https://www.skyvern.com/logo-512.png) since Simple Icons has no entry.

## Authentication coverage

Most Skyvern operations declare no `security` in the OpenAPI document, so
`fallbackSecurity` applies the `x-api-key` scheme to every operation; no tool is public.
