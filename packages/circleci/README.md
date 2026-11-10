# CircleCI

Run and inspect CircleCI pipelines, workflows, jobs, projects, contexts, schedules, webhooks, policies, usage exports and insights (111 tools, 50 of them mutations that require approval).

## Interface

CircleCI's official REST API v2 OpenAPI document: https://circleci.com/api/v2/openapi.json (served from circleci.com, all operations under https://circleci.com/api/v2).

## Auth

- **Personal API token** (`apiKey`): create one at https://app.circleci.com/settings/user/tokens. It is sent as a bearer token. CircleCI API v2 does not support project tokens.

CircleCI does not offer user-created OAuth apps for its public API, so there is no OAuth method.

## Known gaps

- The legacy v1.1 API, the orb registry (v3) and CircleCI's GraphQL API are not published in the v2 spec and are not included.
- CircleCI Server (self-hosted) uses a different host and is not supported.
