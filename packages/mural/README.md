# Mural

Mural whiteboards: murals, widgets (sticky notes, text, shapes, arrows, images, files), rooms, workspaces, templates, tags, chat, comments and users (88 tools, 57 of them mutations that need approval).

**Interface:** OpenAPI, from Mural's official public API definition (OpenAPI 3.1) published through its ReadMe developer portal at https://developers.mural.co/public/reference, fetched from https://dash.readme.com/api/v1/api-registry/8djxl91kmmnrxkk6 and mounted live against https://app.mural.co/api/public/v1. Mural exposes no stable static spec URL; this registry id comes from the portal's own page and could change if Mural republishes the definition. The separate Mural enterprise API (`/api/enterprise/v1`) is not included. No official MCP server was found.

**Auth**

- OAuth (`oauth`) only; Mural has no API keys. Register an app at https://app.mural.co/ (Profile > Apps, see https://developers.mural.co/public/docs/register-your-app), enter its client ID and secret on the connect page, and add the Executor redirect URI shown there as a redirect URL of the app (https redirect URLs are required to share an app). Authorization is at `https://app.mural.co/api/public/v1/authorization/oauth2` and tokens (and refresh) at `.../oauth2/token`, with client credentials in the request body. The token exchange has not been verified against the live endpoint. Requested scopes: identity:read, workspaces:read/write, rooms:read/write, murals:read/write, templates:read/write, users:read; enable the same scopes on the app.

**Known gaps:** Enterprise API endpoints are out of scope. Some endpoints depend on workspace membership or plan.
