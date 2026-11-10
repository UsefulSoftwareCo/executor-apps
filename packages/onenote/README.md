# OneNote

OneNote notebooks, section groups, sections and pages through Microsoft Graph, for the signed-in
user (`/me`), Microsoft 365 groups and SharePoint sites: create, rename, copy and delete
notebooks, sections and pages, read and patch page HTML, manage resources, and poll long-running
operations. 423 tools; every mutation (222) requires approval.

## Interface

OpenAPI. `graph-onenote.json` is Microsoft's official Microsoft Graph v1.0 document
([openapi.yaml at msgraph-metadata commit 15780e9](https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/15780e98e1082517bc7a39a6b75b356a085326d9/openapi/v1.0/openapi.yaml),
committed 2026-10-06, fetched 2026-10-12; about 44 MB for all of Graph) reduced to the
`/me/onenote`, `/groups/{group-id}/onenote` and `/sites/{site-id}/onenote` paths (all depths,
including page content and `onenotePatchContent` under sections and section groups), with only the component schemas those paths reference. Nothing else was
edited. Calls go to `https://graph.microsoft.com/v1.0`. The bundled document is a snapshot of that
commit.

## Auth

OAuth 2.0 (Microsoft Entra, v2 endpoint, using the multi-tenant `common` authorize and token URLs
declared explicitly, because that authority's discovery document advertises a templated
`{tenantid}` issuer; client authentication is `client_secret_post`). Register an app in the Entra admin center
(App registrations), add a Web redirect URI matching the one Executor shows on the connect page,
create a client secret, and enter the client ID and secret in Executor. Scopes: `offline_access`,
`User.Read`, `Notes.ReadWrite.All`. Microsoft's permissions reference lists `Notes.ReadWrite.All` (delegated) as
not requiring admin consent, though a tenant may restrict user consent. It does not state whether
`Notes.ReadWrite.All` is available for personal Microsoft accounts (`Notes.Read` and
`Notes.ReadWrite` explicitly are), so personal-account support is undocumented here. For a single-tenant app registration use the tenant-specific
authority rather than `common`. Notebooks of groups and sites need a work or school account.

## Gaps

- `$count` paths and `/users/{user-id}/onenote` duplicates of `/me` are excluded.
- Page create and content update take HTML (and multipart for embedded files); the generated tools
  expose the JSON/HTML body, so multipart uploads with binary parts are not supported.
- Delegated access only. Microsoft states the OneNote API in Microsoft Graph no longer supports app-only
  authentication effective March 31, 2025
  ([OneNote API overview](https://learn.microsoft.com/en-us/graph/integrate-with-onenote)), so no
  client-credentials method is offered, even though the permissions reference still lists
  application permissions.
- Icon is Microsoft's official OneNote brand icon (Office CDN, `onenote_48x1.svg`); Simple Icons
  has none.
