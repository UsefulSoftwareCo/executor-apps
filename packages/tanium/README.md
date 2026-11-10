# Tanium

Sensors, questions and their results, saved questions, computer groups, packages, actions, users, roles, system status and settings on a Tanium platform, plus the Gateway GraphQL API: 36 tools.

**Interface:** hand-written tools over the Tanium Platform REST v2 API (`https://<server>/api/v2`) and the Gateway GraphQL endpoint (`https://<server>/plugin/products/gateway/graphql`). Tanium's reference (https://developer.tanium.com) and the Swagger document each server hosts are available only to registered customers and partners, so there is no public OpenAPI document, and the integrations.sh sources list none. `operations.ts` wraps the commonly documented v2 endpoints; use `gateway.query` for everything else the Gateway schema exposes. Tools take path ids, a `query` object for filters and a `body` object of JSON fields for writes. Every REST mutation and `gateway.mutate` requires approval; `questions.parse` is a POST but read-only and does not. `gateway.query` parses the document and rejects any mutation or subscription operation, so changes only go through the approval-gated `gateway.mutate`. The endpoint paths and shapes in `operations.ts` (for example `/actions/stop`, `/parse_question`, the `by-name` routes) are written from knowledge of the documented API and could not be confirmed against a public source or a live server.

**Auth:** one method, an API token.
- Create it in the Tanium Console under Administration > Permissions > API Tokens > New API Token. Enter the token and your server hostname (for example `example.cloud.tanium.com`, no path). The token is sent in the `session` header, only to that hostname. What the token may do depends on the persona and roles of the user it belongs to.
- Tanium offers no user-created OAuth app, so none is declared.

**Icon:** Tanium's official favicon mark from `https://www.tanium.com/_assets/favicon.svg` (Simple Icons lacks Tanium).

**Known gaps:** endpoints were written from Tanium's documented REST v2 API without access to the gated reference, so parameter lists may be incomplete (pass extras in `query` or `body`). Newer Tanium modules are reachable only through the Gateway. Nothing was run against a live server.
