# GatherUp

Customer feedback and online review management in GatherUp: businesses, customers, feedback requests, private feedback, online reviews and replies, widgets, smart insights, reputation scorecards, review defense audits, users and agency clients (68 tools).

## Interface

Hand-written tools over GatherUp's REST API v2 (`https://app.gatherup.com/api/v2`). GatherUp publishes no OpenAPI document, only a Postman collection at https://apidocs.gatherup.com/, so the operations were written from that official documentation. Each tool takes an optional `agent` (agency client number), `query` filters for reads, and a `body` for writes; the account's `clientId` is added automatically. Mutations require approval. Request signing: the vendor's collection overview mentions signing requests with a private key, but its Authentication section says Bearer auth makes the hash parameter obsolete, so no private key or hash is needed or sent.

## Auth

API credentials (`apiKey`): the Bearer token and Client ID. The vendor's collection says the Bearer token is found under Account Owner Details (Account Owner only); the Client ID is shown alongside it, though the exact steps for revealing it were not verifiable from the vendor's help article, which did not render when checked. See https://help.gatherup.com/s/article/GatherUp-API-Client-ID-Private-Key-and-Bearer-Token. Agency accounts have one set for the whole account and one per client; with agency credentials pass `agent` to target a client. GatherUp offers no OAuth to customers.

## Known gaps

Omitted operations (68 of the collection's 70): `PUT /user/password/set` (credential-setting, left out deliberately) and `POST /whitelabel/create` (agency white-label provisioning, not yet covered). The vendor documents a rate limit of 5 requests per second, returning 503 above it; the package does no throttling or retry. No official GatherUp OpenAPI document or MCP server was found in the local integrations.sh records, but a final web search for one could not be run, so that is unconfirmed. Response shapes are not modeled (results are returned as JSON). The health check only confirms the credentials reach `/test`.
