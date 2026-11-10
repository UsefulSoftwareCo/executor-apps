# Vast.ai

Rent and manage GPU compute on Vast.ai: search offers, create and control instances, templates, volumes, SSH keys, serverless endpoints and worker groups, billing, API keys and team settings.

Interface: OpenAPI, from Vast.ai's official API reference spec at https://docs.vast.ai/api-reference/openapi.json (base URL https://console.vast.ai/api/v0).

## Auth

- API key: create one in the Vast.ai console under Account > API Keys (https://console.vast.ai/cli/). It is sent as `Authorization: Bearer <key>`. Vast.ai offers no user-created OAuth apps.

## Known gaps

- Mutations (including creating instances, which spends money) always require approval.
- Instance-level proxy endpoints and serverless worker routes run on other hosts and are not covered.
