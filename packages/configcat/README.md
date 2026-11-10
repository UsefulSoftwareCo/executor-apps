# ConfigCat

Manage ConfigCat feature flags and configuration: products, configs, environments, settings (flags), targeting and percentage rules, segments, tags, webhooks, integrations, permission groups and members.

**Interface:** OpenAPI. Tools are generated from ConfigCat's official Public Management API document, https://api.configcat.com/docs/v1/swagger.json (base URL https://api.configcat.com). The separate SCIM user-provisioning API (https://scim-api.configcat.com/openapi/v1/openapi.json, 17 operations) is mounted under the `scim` key. The flag-evaluation SDK endpoints are not included. ConfigCat says not to use the Management API to evaluate flag values.

**Auth:** one method, Public API credentials (HTTP Basic). Create a username and password on the Public API credentials page, https://app.configcat.com/my-account/public-api-credentials, and enter both. ConfigCat's Management API does not offer OAuth.

**SCIM:** a second account type, `scim`, holds an organization-level SCIM token and the organization ID, created on the Authentication & Provisioning page, https://app.configcat.com/organization/authentication. It is separate from the Public API credentials. The organization ID is used by the health check (SCIM paths embed it).

**Known gaps:** none known; every operation in the document is exposed, and mutations require approval.
