# Dribbble

Manage your own Dribbble shots, projects and shot attachments: read your profile, list and fetch shots, create, update and delete shots, and manage projects and attachments (12 tools).

## Interface

Hand-written tools over the Dribbble API v2 (`https://api.dribbble.com/v2`), documented at https://developer.dribbble.com/v2/. Dribbble publishes no OpenAPI document, so each tool wraps one documented endpoint. All mutations require approval.

## Auth

- **OAuth 2** (`oauth`): register an application at https://dribbble.com/account/applications/new and set its callback URL to the redirect URI Executor shows on the connect page. Scopes requested: `public` and `upload`.

## Known gaps

- The Jobs endpoints are omitted: they need a special partner token that Dribbble issues on request.
- The API only returns the authenticated user's own shots and projects; there is no documented search endpoint.
- Shot images must be exactly 400x300 or 800x600 and are passed as base64. Video shots cannot be created through the API.
- Request encoding is ambiguous in the docs: the v2 overview says data is sent as JSON but names Content-Type `application/x-www-form-urlencoded` for POST, PUT and DELETE, and the per-endpoint pages (PUT /shots/:id, projects) do not say. Update and project tools send `application/json`. createShot sends multipart form fields, with tags as `tags[]`, which the docs do not specify.
- Rate limit: 60 requests per minute and 1,440 per day per user.
- The docs are sparse; the tool schemas follow the documented parameters and responses are returned as raw JSON.
