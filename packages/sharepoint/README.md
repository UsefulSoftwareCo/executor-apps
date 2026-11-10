# SharePoint

SharePoint Online through Microsoft Graph: sites and subsites, lists, list items and their fields, list and site columns, content types, document libraries (drives), files and folders (upload, download, copy, move, share links, invitations, versions, check-in/out), site pages, permissions, term store groups and sets, and cross-tenant search (`/search/query`). 292 tools; every mutation (155) requires approval.

## Interface

OpenAPI. `graph-sharepoint.json` is Microsoft's official Microsoft Graph v1.0 document ([openapi.yaml at msgraph-metadata commit 15780e9](https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/15780e98e1082517bc7a39a6b75b356a085326d9/openapi/v1.0/openapi.yaml), about 44 MB for all of Graph) reduced to the SharePoint surface: `/sites` (site, lists, columns, content types, pages, permissions, drives, subsites, term store, `getByPath`), `/drives/{drive-id}` (items, children, content, links, permissions, versions, search, recent), `/me/drive`, `/shares`, `/search/query`, and only the component schemas those paths reference. The openapi version string was changed from 3.0.4 to 3.0.3; nothing else was edited. Calls go to `https://graph.microsoft.com/v1.0`. The bundled document is a snapshot of that commit.

## Auth

OAuth 2.0 (Microsoft Entra, v2 endpoint; the authorize and token URLs are declared on the `common` authority, with `client_secret_post` client authentication, because the `common` discovery document advertises a templated `{tenantid}` issuer). Register an app in the Entra admin center (App registrations), add a Web redirect URI equal to the redirect URI Executor shows on the connect page, create a client secret, and enter the client ID and secret in Executor. Delegated scopes: `offline_access`, `User.Read`, `Sites.ReadWrite.All`, `Files.ReadWrite.All`. Microsoft lists none of these as requiring admin consent, but a tenant may restrict user consent. The app registration must be multi-tenant (supported account types "Accounts in any organizational directory", optionally also personal accounts): the package always uses the `common` authority and has no tenant setting, so a single-tenant registration will not work. The sign-in audience depends on the app registration, but SharePoint content requires a work or school account.

## Known gaps

- Paths nested deeper than eight segments, delta queries, analytics, activities, OneNote, subscriptions, long-running operations, sensitivity/retention labels, thumbnails and `termStores` duplicates are excluded to keep the tool count manageable. Term store is limited to the site's default store.
- Large file uploads: the upload session can be created (`createUploadSession`), but the upload PUT to the returned URL, which is on another host, is not covered by these tools; small files can use the `content` PUT tool.
- Legacy SharePoint REST (`/_api`) is not covered.
- Icon is Microsoft's official SharePoint brand icon (Office CDN, `sharepoint_48x1.svg`); Simple Icons has none.
