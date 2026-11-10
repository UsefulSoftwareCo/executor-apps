# Cradl AI

Cradl AI is an API-first platform for AI document extraction. This package exposes the whole Cradl REST API as tools: agents and agent runs, documents, models, validations and review tasks, hooks, actions, functions, predictions, logs, roles, users, organizations and app clients.

Interface: OpenAPI, from Cradl's own published document at https://docs.cradl.ai/api-reference/openapi.json (API base `https://api.cradl.ai/v1`). Mutations require approval.

## Auth

- `clientCredentials`: create an app client in the Cradl AI app (client id and client secret) and enter them on the connect page. The package exchanges them itself at `https://auth.cradl.ai/oauth2/token` with `grant_type=client_credentials` and `audience=https://api.cradl.ai/v1` (as in Cradl's docs; the generic oauth2 grant cannot send `audience`), caches the token, and sends it as a bearer token to `api.cradl.ai`. No redirect URI is involved. Cradl's token request sends no `scope`, so the token carries the permissions of the roles assigned to the app client: give it roles that cover the tools you want (the OpenAPI spec lists scopes such as `agents:read` and `documents:write`), or calls return 403.

## Known gaps

- The token exchange and the role-based permissions are unverified against a live account (no credentials were used).
- File content upload (`PUT` to the `fileUrl` returned by Create Document, on `files.api.cradl.ai`) is not an operation in the OpenAPI document, so it has no tool.
