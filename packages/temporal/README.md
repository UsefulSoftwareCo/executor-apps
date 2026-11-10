# Temporal

Manages Temporal Cloud control plane resources: namespaces (including regions, capacity and export sinks), users, user groups, service accounts, API keys, custom roles, connectivity rules, audit logs and sinks, billing reports, and account settings.

Interface: OpenAPI, from Temporal's official Cloud Ops API document at https://saas-api.tmprl.cloud/spec.json (API reference: https://saas-api.tmprl.cloud/docs/httpapi.html). The spec uses relative server URLs, so requests go to https://saas-api.tmprl.cloud.

Auth: API key. Create one in Temporal Cloud (a personal key from your Profile page, or a service account key from Settings > API Keys; `tcld apikey create` also works) and paste it as the API key. It is sent as `Authorization: Bearer <key>`. An account admin may need to enable API keys access for the account first.

Known gaps: the Ops API manages the cloud control plane only. It cannot start, signal or query individual Workflows or Activities; that needs the namespace's gRPC endpoint with mTLS or a namespace API key, which is not covered here. Mutations require approval.
