# SeekTable

SeekTable is a business intelligence service for pivot tables, reports, cubes and dashboards. This package lists and reads reports and cubes, exports reports and dashboards (html, csv, json, pdf, png, excel), emails reports, uploads CSV cubes, and backs up the account.

**Interface:** hand-written tools over the documented Web API (`https://www.seektable.com/api`, reference at https://www.seektable.com/help/web-api-integration). SeekTable publishes no OpenAPI document and no remote MCP server. Tools: `listReports`, `getReport`, `exportReport`, `shareReportByEmail`, `listCubes`, `getCube`, `importCsv`, `listDashboards`, `exportDashboard`, `backupAccount`. The mutations (`shareReportByEmail`, `importCsv`) require approval. Binary exports are returned base64-encoded.

**Auth:** API key. Get it in SeekTable under Manage Account, Get API Key. It is sent raw in the `Authorization` header (no `Bearer` prefix). SeekTable has no OAuth.

**Icon:** the official logo (`https://www.seektable.com/img/logo.png`, 128px), as SeekTable publishes no SVG and Simple Icons lacks it.

**Known gaps:** only the cloud host `www.seektable.com` is supported, not self-hosted installations. Cloud accounts have a 50 calls/day limit (500 with Advanced publishing), and `reportParameters` and `backupAccount` need paid plans. Dashboard tools only work when dashboards are enabled. The health check lists cubes.
