# Azure Monitor Activity Log

Query Azure Monitor Activity Log events for a subscription (`listEvents`), for the whole tenant (`listTenantEvents`) and list the event categories (`listEventCategories`). Read-only; 3 tools.

## Interface

Hand-written tools over the Azure Resource Manager REST API (api-version 2015-04-01), following Microsoft's official swagger https://github.com/Azure/azure-rest-api-specs/blob/main/specification/monitor/resource-manager/Microsoft.Insights/Insights/stable/2015-04-01/activityLogs.json. The swagger cannot be loaded directly because it references shared common-types files outside the document. Requests go only to `https://management.azure.com`.

## Auth

OAuth 2.0 only (delegated Microsoft Entra ID; Azure has no user API keys). Register an app in Microsoft Entra ID (App registrations), add a Web redirect URI matching the one Executor shows on the connect page, create a client secret, and add the Azure Service Management delegated permission `user_impersonation`. Enter the client id and secret on the connect page. Metadata is discovered from `https://login.microsoftonline.com/common/v2.0`. The signed-in user also needs an Azure RBAC role that can read the activity log (for example Reader or Monitoring Reader) on the subscription.

## Known gaps

- Only the activity log read APIs are covered; metrics, alerts, diagnostic settings and other Azure Monitor APIs are not.
- Tenant-level events need the user to hold Monitoring Reader (or equivalent) at the tenant root scope.
- The icon is the Monitor icon from Microsoft's official Azure architecture icon set; Simple Icons does not carry it.
