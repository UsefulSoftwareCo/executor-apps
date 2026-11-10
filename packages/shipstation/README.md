# ShipStation

Covers ShipStation shipping and fulfillment: with the v2 API, rates, labels, shipments, batches, manifests, tracking, carriers, warehouses, inventory and webhooks (174 tools); with the legacy v1 API, orders, shipments, customers, products, stores and warehouses (47 tools). The v1 and v2 APIs are separate products of ShipStation with separate credentials, so an account uses one or the other.

## Interface

OpenAPI, from ShipStation's official documents:

- v2: https://docs.shipstation.com/_bundle/apis/@shipstation-v2/openapi.yaml (host `api.shipstation.com`)
- v1 (legacy): https://docs.shipstation.com/_bundle/apis/@shipstation-v1/openapi.yaml (host `ssapi.shipstation.com`)

ShipStation also runs a documentation MCP server (`https://docs.shipstation.com/mcp`); it only searches docs, so it is not mounted.

## Auth

- **API v2 key** (`apiKey`): in ShipStation, open Settings, then Account, then API Settings (v2) and generate a key. It is sent in the `api-key` header.
- **Legacy API v1 key and secret** (`legacy`): in ShipStation, open Settings, then Account, then API Settings and copy the API key and API secret. They are sent as HTTP Basic credentials.

ShipStation offers no OAuth for direct API access, so there is no OAuth method.

## Known gaps

All operations of both documents compile; none are skipped. Every mutation requires approval. v1 is rate limited and ShipStation recommends v2 for new integrations.
