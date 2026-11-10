# Copper

Leads, people, companies, opportunities (with pipelines, stages, loss reasons and customer
sources), projects, tasks, activities and custom activity types, custom field definitions,
related items, attached files (read only), webhooks, users and tags in Copper CRM, plus a
`request` escape hatch for any other developer API v1 endpoint (for example the bulk endpoints).

Interface: hand-written tools over Copper's Developer API v1
(`https://api.copper.com/developer_api/v1`, docs at https://developer.copper.com/). Copper
publishes no OpenAPI document (only a Postman collection), GraphQL API or official MCP server,
so the tools are written by hand (74, including `request`). Paths follow the official
Postman collection and docs. Search endpoints are POST requests taking filters, `page_number`
and `page_size` in `body`.

Auth:

- API key (`apiKey`): in Copper go to System settings > API Keys and click GENERATE API KEY.
  Enter the key and the email address of the user who owns it; Copper requires both
  (`X-PW-AccessToken`, `X-PW-UserEmail`, plus `X-PW-Application: developer_api`) on every request.
- OAuth is not offered. Copper does support OAuth 2.0 (authorization code grant, authorization
  endpoint https://app.copper.com/oauth/authorize, token endpoint https://app.copper.com/oauth/token,
  scope `developer/v1/all`), but every application must first be registered with Copper
  (contact partners@copper.com) to receive a client_id and client_secret, so a user cannot
  create an OAuth app themselves. It is omitted for that reason. Copper's docs do not state the
  token endpoint authentication method, so it is unknown.
  See https://developer.copper.com/introduction/oauth/index.html.

Approvals: every mutation asks for approval (searches are reads even though they use POST).

Known gaps: file upload (signed S3 flow) and bulk create/update are reachable only through
`request`. Copper limits calls to 180 per minute; 429 responses are retried a few times.
Request and response shapes are passed as JSON, not typed.
