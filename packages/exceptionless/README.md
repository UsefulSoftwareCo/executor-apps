# Exceptionless

Real-time error and event tracking with Exceptionless: events, stacks, projects, organizations, users, tokens and webhooks.

Interface: the vendor's official OpenAPI 3.1 document at https://api.exceptionless.com/docs/v2/openapi.json, calling https://api.exceptionless.com.

Auth: API key only. Create a user API token (or use a project API key) in the Exceptionless app under Account > API Keys / Project > API Keys; it is sent as a bearer token. The vendor offers no user-created OAuth apps for the REST API, so OAuth is not offered.

Icon: the official mark from the vendor's MediaKit (https://github.com/exceptionless/MediaKit, icon.svg).

Known gaps: only the hosted cloud (api.exceptionless.com) is supported; self-hosted instances are not configurable.
