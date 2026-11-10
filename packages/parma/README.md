# Parma

Parma CRM (relationships, notes, deals, groups, group memberships and pipeline stages) through Parma API V1, using Parma's official OpenAPI 3.0 document at https://developers.parma.ai/api-docs/v1/swagger.yaml. All calls go to `https://app.parma.ai`.

## Auth

- **API token** (`apiKey`): create one in Parma at https://app.parma.ai/api. Sent as `Authorization: Bearer <token>`.
- **OAuth 2.0** (`oauth`): authorization code grant with scope `full`. Parma does not offer self-service client registration: email partner@parma.ai with an app name, a 512px PNG icon and the redirect URI to obtain a `client_id` and `client_secret`, then enter them on the connect page. Use the redirect URI Executor shows for the connection.

## Known gaps

- Parma's site says the company is joining Folk; the API may change or be retired.
- The spec has about 22 operations; no operations are skipped.
- Icon is Parma's official app icon (256px PNG from parmacrm.com), since no SVG is published.
