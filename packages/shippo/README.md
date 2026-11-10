# Shippo

Multi-carrier shipping with Shippo: addresses, shipments, rates, labels (transactions), tracking, batches, carrier accounts, customs, pickups, manifests, orders, refunds, service groups, parcel templates and webhooks. 71 tools (33 mutations, each requiring approval).

## Interface

Shippo's official OpenAPI 3.1 document, https://docs.goshippo.com/spec/shippoapi/public-api.yaml, against https://api.goshippo.com. Shippo also runs an official remote MCP server (https://mcp.shippo.com) but the REST API is broader.

## Auth

- **API token**: create one in the Shippo dashboard under Settings > API (live or test). Sent as `Authorization: ShippoToken <token>`.
- **OAuth 2.0**: Shippo issues OAuth partner credentials on request: contact Shippo's partner team with your company name, callback URL and use case ([OAuth guide](https://docs.goshippo.com/o-auth-integrations/o-auth)). Endpoints: authorization `https://goshippo.com/oauth/authorize`, token `https://goshippo.com/oauth/access_token` (client ID and secret sent in the POST form body, `grant_type=authorization_code`), scope `*` (the only supported scope). Enter the partner client ID and secret on the connect page; the callback URL must be one Shippo has on file for your app. Access tokens never expire and are sent as `Authorization: Bearer <token>` (the docs state `ShippoToken` does not work with them).

Because OAuth needs credentials from Shippo, most users should use an API token.

## Known gaps

The spec (OpenAPI 3.1, 71 operations) is the current one at that URL. The carrier sign-in initiator (`GET /carrier_accounts/{id}/signin/initiate`) requires approval because it starts a carrier authorization flow. Embedded-widget JWT auth (`POST /embedded/authz`) is not used; the OAuth flow was not exercised against a real account.
