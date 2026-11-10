# Excel

Excel workbooks stored in OneDrive or SharePoint, through Microsoft Graph: sessions, worksheets,
ranges (values, formulas, formats, sort, merge, insert, delete), tables (columns, rows, filters,
sort), charts, named items, comments, plus the drive lookups needed to find a workbook (my drive,
a drive, an item, its children, search and recent files). 618 tools; every mutation (227) requires
approval.

## Interface

OpenAPI. `graph-excel.json` is a slice of Microsoft's official Microsoft Graph v1.0 document
([openapi.yaml at msgraph-metadata commit 15780e9](https://raw.githubusercontent.com/microsoftgraph/msgraph-metadata/15780e98e1082517bc7a39a6b75b356a085326d9/openapi/v1.0/openapi.yaml),
committed 2026-10-06; about 44 MB for all of Graph), built offline by `scripts/graph-slice.ts excel`
(source URL and generator recorded in its `info.x-executor-slice`). The slice:

- keeps `/drives/{drive-id}/items/{driveItem-id}/workbook` paths up to five segments below
  `workbook`, without `workbook/functions/*`, `$ref` link operations and the
  `tableRowOperationResult`/`sessionInfoResource` paths, plus six drive lookups (`/me/drive`,
  `/drives/{drive-id}`, `/drives/{drive-id}/items/{driveItem-id}`, its `children`,
  `/drives/{drive-id}/search(q='{q}')` and `/drives/{drive-id}/recent()`);
- bounds schema depth: inside component schemas, references to other Graph entity types
  (navigation properties such as `workbookWorksheet.tables` or `workbookTable.worksheet`) become a
  small object with `id` and `additionalProperties: true`. Each tool still has the full schema of
  the entity it reads or writes, and list tools return full entities;
- drops `discriminator` mappings and unused components, and shortens operationIds that repeat
  path-parameter names so every tool name stays under 100 characters.

Without the depth bound the tool listing is 87.2 MB and fails on hosted Executor; with it, the full
listing is 2.4 MB. Calls go to `https://graph.microsoft.com/v1.0`. Workbook calls need a
`drive-id` and `driveItem-id`: call the `/me/drive` tool for the drive id, then search the drive or
list folders with the children tool. To pick up new operations, regenerate with the commands at the
top of `scripts/graph-slice.ts`.

## Auth

OAuth 2.0 (Microsoft Entra, v2 endpoint, discovered from
`https://login.microsoftonline.com/common/v2.0`). Register an app in the Entra admin center
(App registrations), add a Web redirect URI matching the one Executor shows on the connect page,
create a client secret, and enter the client ID and secret in Executor. Scopes: `offline_access`,
`User.Read`, `Files.ReadWrite.All` (needed for files in shared drives and SharePoint). No admin
consent is required for personal or work accounts; a tenant may restrict user consent. For a
single-tenant app registration use the tenant-specific authority rather than `common`.

## Gaps

- Excel worksheet functions (`workbook/functions/*`, 367 operations such as `abs` or `vlookup`) are
  excluded; they are pure calculators and would drown the useful tools. Formulas can be written to
  cells instead.
- Paths nested deeper than five segments below `workbook`, `$ref` link operations and
  `tableRowOperationResult`/`sessionInfoResource` paths are dropped.
- Creating, uploading and deleting workbook files is not included beyond what the workbook paths
  provide; use a OneDrive/SharePoint package for file management.
- The service-to-service (client-credentials) method is not offered, since it needs tenant
  admin consent. The workbook API only works with delegated access for personal accounts.
- Only the `/drives/{drive-id}/items/{id}` addressing is in Microsoft's document; `/me/drive/items/{id}/workbook`
  is not.
- No shared-with-me lookup.
- Nested entities in responses are typed only as `{ id, ... }` (the depth bound); the data Graph
  returns is unchanged.
- Icon is Microsoft's official Excel brand icon (Office CDN, `excel_48x1.svg`); Simple Icons has none.
