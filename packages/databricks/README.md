# Databricks

Run SQL and manage a Databricks workspace: clusters, libraries, instance pools, cluster policies, jobs and
runs, SQL warehouses and statements, saved queries, alerts, AI/BI dashboards, Genie spaces, Unity Catalog
(catalogs, schemas, tables, volumes, functions, models, grants, lineage, Delta Sharing), notebooks and
workspace files, DBFS, Git folders, secrets, tokens, permissions, SCIM users and groups, Lakeflow pipelines,
model serving, vector search, MLflow, Databricks Apps and command execution. 216 tools (104 mutations; every
mutation asks for approval). Read-only POST endpoints (cluster events, serving and vector search queries,
MLflow searches) are treated as queries.

## Interface

Custom tool table exposed through the OpenAPI importer. Databricks publishes no OpenAPI document (its SDKs
generate from an internal spec), so `operations.txt` lists operations written from the official
[workspace REST API reference](https://docs.databricks.com/api/workspace/introduction), and `generate.py`
turns it into `spec.ts` (`python3 -I packages/databricks/generate.py`). Request bodies declare the common
fields and accept any others the API takes (`additionalProperties`), so newer options still work. Tools are
grouped by area, for example `sql.executeStatement`, `jobs.runJobNow`, `unityCatalog.listTables`.

## Auth

A personal access token. In the workspace choose your username, Settings, Developer, Access tokens, Manage,
Generate new token ([docs](https://docs.databricks.com/aws/en/dev-tools/auth/pat)). Enter the token and the
workspace hostname (the host in your workspace URL, such as `dbc-a1b2345c-d6e7.cloud.databricks.com`,
`adb-1234567890123456.7.azuredatabricks.net` or `1234567890123456.7.gcp.databricks.com`). A service principal
token works too. The token is sent as `Authorization: Bearer`.

## Known gaps

- No OAuth. Databricks OAuth (user sign-in and machine-to-machine) uses per-workspace endpoints
  (`https://<workspace>/oidc/v1/authorize` and `/token`) and the `oauth2` declaration takes static URLs.
  Client-credentials M2M tokens also expire after an hour with no refresh hook for secret fields.
- Account-level APIs (`accounts.cloud.databricks.com`, workspaces, billing, account SCIM) are not included;
  they need a different host and account id.
- Only commercial-cloud hosts (`cloud.databricks.com`, `azuredatabricks.net`, `gcp.databricks.com`) are
  allowed; GovCloud, Azure Government and China hosts are not.
- Binary Files API upload and download, streaming responses and the Genie/Unity Gateway MCP servers are not
  exposed. Databricks also offers managed MCP servers (`/api/2.0/mcp/...`, OAuth only); they are per
  workspace and cannot be declared with a static URL.
- The tool table covers the commonly used operations, not every endpoint (for example Git credentials, IP
  access lists, global init scripts, budgets, Lakebase and clean rooms).
