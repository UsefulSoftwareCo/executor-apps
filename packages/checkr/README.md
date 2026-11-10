# Checkr

Background screening with Checkr: candidates, invitations, reports and individual screenings, adverse actions, packages, nodes, subscriptions, webhooks and accounts. This package also covers Checkr Partner integrations (the partner OAuth flow only produces an account access token, which this package accepts).

## Interface

OpenAPI. Checkr's official OpenAPI 3.0 document, published from its docs portal at https://docs.checkr.com: https://api.redocly.com/registry/bundle/checkr/Checkr%20Public%20API/v1/openapi.yaml. Requests go to `https://api.checkr.com/v1`. Every mutation requires approval.

## Auth

API key. Paste a secret API key (Checkr Dashboard, Account Settings, Developer Settings) or, for partners, the access token Checkr issued for a customer account. Both are sent as the HTTP Basic username with an empty password. The staging environment (`api.checkr-staging.com`) is not supported; use a separate deployment for it.

## Known gaps

- No OAuth sign-in. Checkr Partner OAuth authorizes at `https://partners.checkr.com/authorize/<client_id>`, which puts the partner's client id in the URL path, so it cannot be declared as a fixed authorization URL. Complete that flow in your own integration and paste the resulting access token.
- The Customer MCP server (`https://mcp.checkr.com`) and Candidate MCP server are not mounted; the REST API covers a superset of the reporting they expose.
