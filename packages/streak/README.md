# Streak

Streak is a CRM built into Gmail. This package exposes pipelines, boxes, contacts, organizations, tasks, comments, meetings, users, search and webhooks.

Interface: OpenAPI, from Streak's official document at https://www.streak.com/api/openapi.json (served from `https://api.streak.com/api`). Streak also runs an OAuth-protected MCP server at https://api.streak.com/mcp; it is not mounted here because the REST document covers the same data.

## Auth

API key (`apiKey`). Streak uses HTTP Basic auth with the key as the username and an empty password (the published document labels the scheme `bearerAuth`, but the docs at https://streak.readme.io/docs/authentication say Basic). Create a key in Gmail: Streak sidebar, Integrations, Streak API, Create New Key. The key has all of your own privileges.

## Gaps

No OAuth: Streak offers none for the REST API. Operations missing from the published document are not available.
