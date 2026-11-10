# Pingboard

Pingboard's org chart and employee directory: users, groups, custom fields, statuses (and status types), guests, the company record, linked accounts and user/group search. Users, groups, custom fields and statuses support create, update and delete; the rest are read-only. Every write needs approval.

**Interface:** hand-written tools over the Pingboard REST API v2 (`https://app.pingboard.com/api/v2`). Pingboard documents the API only in an Apiary reference (https://pingboard.docs.apiary.io/) and publishes no OpenAPI document. The resource list, paths, HTTP methods (PATCH for updates), `page`/`page_size`/`sort`/`include` parameters and the `{ <plural>: fields }` write envelope were checked against that reference's API description (served at https://jsapi.apiary.io/apis/pingboard.json). Meetings, surveys and private-note endpoints are documented but not wrapped.

**Auth:** OAuth 2.0 client credentials, as the reference recommends for service accounts. Create a service account at https://app.pingboard.com/service_accounts (company admin required) and enter its client id and client secret when connecting. Executor exchanges them at `https://app.pingboard.com/oauth/token`, with the credentials sent as form fields in the body. There is no redirect URI, no scopes, and no API-key method. A service account with the Regular User role is read-only for most data; admin-only calls need a company admin service account.

**Known gaps:** no meetings, surveys or notes endpoints; linked accounts can only be fetched by id (no list endpoint is documented); list tools pass attribute filters through `filters` rather than typed fields.
