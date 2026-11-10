# OneDrive

OneDrive files and folders through Microsoft Graph: drives, listing and searching items, upload (small files), download, copy, move, delete and restore, share links and invitations, permissions, versions, check-in/out, recent and followed items, and shared items (`/shares`). 92 tools; every mutation (52) requires approval.

## Interface

OpenAPI. `graph-onedrive.json` is Microsoft's official Microsoft Graph v1.0 document ([openapi.yaml at msgraph-metadata commit 15780e9](https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/15780e98e1082517bc7a39a6b75b356a085326d9/openapi/v1.0/openapi.yaml), about 44 MB for all of Graph) reduced to `/me/drive`, `/me/drives`, `/drives`, `/drives/{drive-id}` (items, root, special folders, following, recent, search) and `/shares/{id}`, with only the component schemas those paths reference. Paths nested deeper than eight segments, SharePoint list paths, workbook (Excel) paths, thumbnails, analytics, activities, sensitivity labels and `$count` are dropped, `discriminator` blocks are removed, and the openapi version string was changed from 3.0.4 to 3.0.3. Calls go to `https://graph.microsoft.com/v1.0`. Start with the `/me/drive` tool for the drive id, get the root item id from the `/drives/{drive-id}/root` tool, then list children.

## Auth

OAuth 2.0 (Microsoft Entra, v2 endpoint, discovered from `https://login.microsoftonline.com/common/v2.0`). Register an app in the Entra admin center (App registrations), add a Web redirect URI equal to the redirect URI Executor shows on the connect page, create a client secret, and enter the client ID and secret in Executor. Choose supported account types "Accounts in any organizational directory and personal Microsoft accounts" so both OneDrive for Business and personal OneDrive work. Delegated scopes: `offline_access`, `User.Read`, `Files.ReadWrite.All`. None require admin consent, though a tenant may restrict user consent.

## Known gaps

- A service-to-service (client-credentials) method is not offered because it needs tenant admin consent and per-user drive paths.
- Path-based addressing (`/root:/folder/file:`) and `/me/drive/items/...` aliases are not in Microsoft's document; use `/drives/{drive-id}/items/{id}`.
- Large uploads need an upload session (`createUploadSession`) followed by PUTs to the returned URL on another host, which these tools do not cover; small files can use the `content` PUT tool.
- The `delta()` operations are included; only following the returned `nextLink`/`deltaLink` token paging is left to the caller. Change-notification subscriptions are not included.
- Dropped from the reduction: `sharedWithMe()` (deprecated by Microsoft), bundles, retention labels, and the `createdByUser`/`lastModifiedByUser` navigation paths.
- Icon is Microsoft's official OneDrive brand icon (Office CDN `onedrive_48x1.svg`); Simple Icons has none.
- The bundled document is a snapshot of that commit.
