# Microsoft Power BI

Workspaces (groups), datasets, reports, dashboards, tiles, dataflows, imports, refreshes, DAX queries, gateways, capacities, apps, pipelines and the tenant admin APIs of the Power BI REST API (268 tools).

## Interface

OpenAPI, loaded live from Microsoft's official Power BI swagger (Swagger 2.0) in the PowerBI-CSharp SDK repository: https://raw.githubusercontent.com/microsoft/PowerBI-CSharp/master/sdk/swaggers/swagger.json. Requests go only to `https://api.powerbi.com`. Every mutation requires approval.

## Auth

OAuth 2.0 only (Power BI has no API keys). Register an app in Microsoft Entra ID (App registrations), add a Web redirect URI matching the one Executor shows on the connect page, create a client secret, and add the Power BI Service delegated permissions Workspace.ReadWrite.All, Dataset.ReadWrite.All, Report.ReadWrite.All, Dashboard.ReadWrite.All, Dataflow.ReadWrite.All, Content.Create, Capacity.Read.All, App.Read.All and Pipeline.ReadWrite.All (plus offline_access, which Entra grants automatically). Enter the client id and secret on the connect page. Metadata is discovered from `https://login.microsoftonline.com/common/v2.0`; the tenant must allow service use of Power BI APIs.

## Known gaps

- Gateway operations are covered by Dataset.ReadWrite.All; App.Read.All does not support service principals (Microsoft limitation). No pipeline or app operations are excluded beyond the skipped request-body ones.
- 19 operations with unsupported request bodies (such as file-upload imports) are skipped.
- Admin endpoints need `Tenant.Read.All` / `Tenant.ReadWrite.All` and a Fabric administrator; those scopes are not requested by default.
- The spec is Swagger 2.0 and lags the live API; newer Fabric-era endpoints live at api.fabric.microsoft.com and are not included.
- The icon is the Power BI logo from Wikimedia Commons (Microsoft's published logo); Simple Icons does not carry it.
