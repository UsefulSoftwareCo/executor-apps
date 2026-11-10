# Spondyr

Generate and deliver template-driven correspondence (email, SMS, fax, postal mail) with Spondyr, and manage the configuration behind it: transaction types, event types, recipients, conditions, search filters and templates. It also covers batch generation, delivery, retry, status and search, and the SSO user stub for embedding Spondyr.

## Interface

Hand-written tools (39) over Spondyr's REST API at `https://client.spondyr.io/api/v1.0.0`. Spondyr publishes no OpenAPI document, MCP server or GraphQL API; the tools follow its official API documentation at https://client.spondyr.io/#/Public/Public/Documentation (endpoint reference at `#/Public/Public/APIDocumentation`).

## Auth

One method, `apiKey`, with two fields that Spondyr requires on every call:

- **API key**: the Subscription API key, generated when you sign up.
- **Application token**: the token of the Application you integrate, also generated at sign-up.

Both are found in the Spondyr web app at https://client.spondyr.io after logging in (Subscriptions and Applications). The API has no OAuth.

Spondyr takes the credentials in the request itself, not in a header: in the query string for GET and DELETE, in the JSON body for POST and PUT. The tools build this for you. Errors usually return HTTP 200 with `APIStatus: "ERROR"`; the tools turn those into failures. The account health check lists transaction types.

## Known gaps

- Template content is uploaded as Base64 (`templates.uploadContent`) and downloaded inside `templates.get`; Word-document authoring and previews happen in the web app.
- Subscription-level settings (applications, users, tenants, destinations, sending domains) have no API and are not covered.
- Multi-tenant Applications are supported: every tool takes an optional `tenantToken`, sent as `TenantToken` in the query string or JSON body. Single-tenant Applications leave it out.
- GET and DELETE calls put the credentials in the URL because Spondyr's API requires it.
- Not exercised against a live account.
