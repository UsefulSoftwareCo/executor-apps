# Retently

Customer experience surveys with Retently: customers, companies, feedback, campaigns, NPS/CSAT/CES scores, trends, outbox, suppressions, plus sending surveys and importing historical feedback.

## Interface

Hand-written tools (32) over Retently's REST API v2 at `https://app.retently.com/api/v2`, documented at https://www.retently.com/docs/api/. Retently publishes no OpenAPI document and no MCP server, so the tools are written from the official docs. Every mutation requires approval. Response bodies are returned as JSON as the API sends them.

## Auth

API token (`apiKey`): create one in Retently in your Retently account settings, choosing Read or Write permission (Write allows GET, POST and DELETE). A read key gets 403 on write tools. The token is sent in the `X-Api-Key` header. Retently's OAuth is only offered to integration partners, so there is no OAuth method.

## Known gaps

- Rate limit is 150 requests per minute.
- Attribute filters (`attributes[i][name]`, `match`) on customers, feedback and outbox, and the deprecated `/nps/*` endpoints are not exposed.
- Subscriber custom properties are accepted only through the `properties` field (array of `{label, value, type}`, per the docs' shared shape); other undeclared subscriber keys are dropped by the schema.
- Ecommerce order-attribute filters on feedback are not exposed.
- Write calls with empty or undocumented response bodies (suppression deletes, `syncAttributes`) return the parsed body, or `{status}` when the body is empty.
- Only the `app.retently.com` host is documented; no regional hosts.
