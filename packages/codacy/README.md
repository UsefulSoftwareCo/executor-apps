# Codacy

Codacy tools for automated code quality and security: repositories, issues, pull requests, coverage, organizations, people, integrations, coding standards and settings.

## Interface

OpenAPI, from Codacy's official document at https://api.codacy.com/api/api-docs/swagger.yaml (API v3, base URL https://api.codacy.com/api/v3). 291 tools, 141 of them mutations (each asks for approval).

## Auth

- **API key** (`apiKey`): an account API token, sent in the `api-token` header. Create it in Codacy under Account settings > Access management > Account API tokens (https://docs.codacy.com/codacy-api/api-tokens/).

Codacy has no user-created OAuth apps, so there is no OAuth method.

## Known gaps

Only account API tokens are supported. A few repository-scoped operations also accept a repository `project-token`; that scheme is not offered.
