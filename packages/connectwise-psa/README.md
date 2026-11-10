# ConnectWise PSA

ConnectWise PSA (formerly ConnectWise Manage): service tickets, notes and boards, companies, contacts, projects and phases, time and expense entries, agreements, invoices, sales opportunities, configurations, procurement, members, callbacks and system lookups.

## Interface

Hand-written tools (238) over the ConnectWise PSA REST API at `https://<host>/v4_6_release/apis/3.0`, documented on the ConnectWise Developer Network (https://developer.connectwise.com/Products/ConnectWise_PSA). ConnectWise publishes its Swagger document only behind a developer login and every instance serves it from a company-specific URL, so there is no public OpenAPI file to compile; each operation is declared from the REST reference instead. Most resources get `list`, `count`, `get`, and where the API allows, `create`, `update` (JSON Patch) and `delete`. Lists take `conditions`, `childConditions`, `customFieldConditions`, `orderBy`, `page`, `pageSize` and `fields`. Nested resources (notes, sites, statuses) take the parent id as `parentId`. Every write requires approval. ConnectWise has no official remote MCP server.

## Auth

- **API member keys.** In ConnectWise PSA create an API Member (System > Members > API Members), add an API key, and copy its public and private key (the private key is shown once). Register an integration at https://developer.connectwise.com/ClientID to get a Client ID. Connect with:
  - hostname: the cloud API host, for example `api-na.myconnectwise.net`, `api-eu.myconnectwise.net`, `api-au.myconnectwise.net` or `api-staging.connectwisedev.com`;
  - company id: the login company id used at sign-in;
  - public key and private key of the API member;
  - the Client ID.

  Requests use HTTP Basic with `<companyId>+<publicKey>:<privateKey>` and the `clientId` header, as ConnectWise documents. The member's security role limits what the tools can reach.

ConnectWise PSA has no OAuth, so none is offered.

## Known gaps

- Only the ConnectWise cloud hosts (`*.myconnectwise.net`, `*.connectwisedev.com`) are accepted; self-hosted on-premises servers on other domains are not.
- The tools cover the commonly used resources, not the full several-thousand-endpoint API. Attachments/document upload, procurement receiving, billing batches, the long tail of setup tables and most custom-field value endpoints are not included. Custom fields on a record come back in its `customFields` array and can be changed with `update`.
- The API version header is not pinned; ConnectWise serves its default version.
- The icon is the swirl mark cropped from the logo SVG on connectwise.com.
