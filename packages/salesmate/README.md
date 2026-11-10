# Salesmate

Contacts, companies, deals, activities (tasks, calls, meetings), products and variations, notes on every module, custom module records and users in the Salesmate CRM: 64 tools.

## Interface

Hand-written tools over the official Salesmate public REST APIs (`https://<link name>.salesmate.io/apis/...`, docs at https://apidocs.salesmate.io/). Salesmate publishes its reference only as a Postman-hosted collection, not an OpenAPI document, and has no GraphQL API or official remote MCP server, so the endpoints in that collection are wrapped directly. Create and update tools take the raw JSON body from the API reference; search tools take a filter body plus `rows` (max 250) and `from`. Every create, update and delete tool requires approval.

## Auth

Access key. In Salesmate open the user menu (top right) > My Account > Access Key and provide:

- **Link name**: the host of your Salesmate URL, for example `demo.salesmate.io`. Sent as the `x-linkname` header and used as the API host.
- **Access key**: sent as the `accessToken` header. It acts as the user who owns it.

No OAuth flow is documented, so none is declared. Only `*.salesmate.io` hosts are accepted.

## Known gaps

- Only the v4 and v3/v1 endpoints in the public Postman collection are wrapped; the documented v1/v3 deprecation applies to older endpoints not included here.
- Webhooks, email, calls, reports and other endpoints outside the collection are not covered.
- Vendor icon: the mark cropped from the official logo SVG on https://www.salesmate.io/.
