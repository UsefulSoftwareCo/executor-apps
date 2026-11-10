# Omni

Omni is a business intelligence platform with a semantic layer. This package exposes the Omni REST API: documents and dashboards, queries, models and branches, connections, schedules, users and groups, AI, folders, labels and more.

Interface: OpenAPI, from Omni's official document at https://docs.omni.co/api/openapi.yaml (listed in https://docs.omni.co/llms.txt). Omni is hosted per instance (`https://<instance>.omniapp.co/api`); the package points the document at the account's own instance. The Playground server in the document (`*.playground.exploreomni.dev`) is not supported.

Auth: API key only. Enter your instance subdomain (the `acme` in `acme.omniapp.co`) and a bearer token: an Organization API Key (Settings > API, admin) or a personal access token (Settings > API). Tool results are limited by the token's permissions. The health check calls `GET /v1/whoami`.

Known gaps: no OAuth (Omni's OAuth is only offered through its MCP server at https://callbacks.omniapp.co/callback/mcp, which is not mounted here). The Playground environment is unsupported.
