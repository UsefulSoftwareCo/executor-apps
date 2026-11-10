# Callback24

Callback24 call-back and call-tracking: list, create, update and cancel phone
calls, fetch call info and recordings, and manage users, services and routing
groups.

**Interface:** Callback24's official Swagger 2.0 document (version 1.26),
published on SwaggerHub at https://app.swaggerhub.com/apis-docs/callback24/callback24/1.26
and fetched from https://api.swaggerhub.com/apis/callback24/callback24/1.26. It
describes the REST API on `https://panel.callback24.io/api/v1`. Every mutation
asks for approval.

**Auth:** API token. In the Callback24 panel (https://panel.callback24.io) click
the top-right profile icon, choose My profile, then the API tab and copy the
token. It is sent in the `X-API-TOKEN` header. No OAuth: Callback24 offers only
API tokens.

**Known gaps:** the API is pinned to spec version 1.26; the widget JavaScript
API (popup events) is client-side and not a tool.
