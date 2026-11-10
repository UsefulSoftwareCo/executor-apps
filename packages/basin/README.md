# Basin

Manage [Basin](https://usebasin.com) form backends: forms, submissions, projects, custom domains, form webhooks, mail templates and legacy form views.

## Interface

OpenAPI, from Basin's official Swagger document: https://usebasin.com/api_docs/v1/swagger.yaml (API base `https://usebasin.com/api/v1`). Mutations require approval.

## Auth

- **Account API key** (`apiKey`): sent as `Authorization: Token <key>`. Use the account API key (Account Settings, API Settings), which covers every form and project. Form API keys (Form, Integrations, API) are limited to a single form and are not supported: the connection health check reads account-level domains, which a form key is not guaranteed to access. Basin's separate MCP key (My Account, AI Assistant (MCP)) for https://usebasin.com/mcp does not work with the REST API. API access requires Basin's Growth, Pro or Agency plan. Basin offers no OAuth.

## Known gaps

- Form Studio fields and schema are not exposed by Basin's API.
- The public visitor submission endpoint (`POST /f/:id`) is not a tool.
