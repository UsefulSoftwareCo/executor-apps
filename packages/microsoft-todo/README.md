# Microsoft To Do

Microsoft To Do task lists, tasks, checklist items, attachments, linked resources and open
extensions through Microsoft Graph, for the signed-in user (`/me/todo`): create, update and delete
lists and tasks, manage checklist items, and read change sets with the `delta()` functions. Every
mutation requires approval.

## Interface

OpenAPI. `graph-todo.json` is Microsoft's official Microsoft Graph v1.0 document
([openapi.yaml at msgraph-metadata commit 15780e9](https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/15780e98e1082517bc7a39a6b75b356a085326d9/openapi/v1.0/openapi.yaml),
about 44 MB for all of Graph) reduced to the `/me/todo` paths (`$count` paths excluded), with only
the component schemas those paths reference and `discriminator` blocks stripped so the bundle is
self-contained. Nothing else was edited. Calls go to `https://graph.microsoft.com/v1.0`.

## Auth

OAuth 2.0 (Microsoft Entra, v2 endpoint, using the multi-tenant `common` authorize and token URLs
declared explicitly because that authority's discovery document advertises a templated `{tenantid}`
issuer; client authentication is `client_secret_post`). Register an app in the Entra admin center
(App registrations), choose accounts in any organizational directory and personal Microsoft
accounts, add a Web redirect URI matching the one Executor shows on the connect page, create a
client secret, and enter the client ID and secret in Executor. Scopes: `offline_access`,
`User.Read`, `Tasks.ReadWrite`. Neither Tasks scope requires admin consent. For a single-tenant
registration use the tenant-specific authority instead of `common`.

## Gaps

- Delegated access only; there is no API-key method.
- Attachment upload sessions and `$value` content are included as plain operations; binary
  streaming is not supported.
- `/users/{id}/todo` duplicates of `/me` are not exposed.
- Icon is Microsoft's official To Do brand icon (Office CDN, `todo_48x1.svg`); Simple Icons has none.
