# Flotiq

Flotiq API-first headless CMS: content type definitions (create, read, update, delete), content objects of any content type (list, get, create, replace, patch, delete, batch create/patch/delete, versions, removed ids), full-text search with filters and aggregations, and GraphQL. 20 tools, 11 of them mutations (each asks for approval).

## Interface

The Flotiq REST API at `https://api.flotiq.com`. Flotiq publishes no static OpenAPI document: `https://api.flotiq.com/api/v1/open-api-schema.json` is generated per account and needs an API key, so it cannot be mounted live. `openapi.json` here is derived from the official full-schema example in the docs (`https://flotiq.com/docs/API/open-api-schema/`, source `flotiq/flotiq-docs`): the sample `_media` content endpoints were generalised to `/api/v1/content/{contentType}` with free-form object bodies, so one set of tools works for any content type, including ones you define. Request and response schemas of your own content types are therefore not typed; fetch a definition with `getContentDefinition`. The per-account document was considered and not used because the framework's live `source.url` mode is not known to send account credentials to the schema URL, and the key would be needed before the account exists. I did not find an official Flotiq MCP server.

The account health check is `GET https://api.flotiq.com/api/auth-context`, the endpoint Flotiq's docs name for validating a key.

## Auth

API key, sent as the `X-AUTH-TOKEN` header. Create it in the Flotiq dashboard under Settings, API keys (a read-only key, a read and write key, or a user-defined key scoped to chosen content types). Flotiq has no OAuth for third-party apps.

## Known gaps

- Media file upload (`POST /api/media`, multipart) and image delivery (`/image/...`) are not exposed.
- Content object bodies and responses are untyped objects.
- Read-only keys can call read tools only.
