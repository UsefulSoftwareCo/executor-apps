# Shipday

Shipday is a local delivery management platform. This package covers its public REST API: delivery orders (list active, insert, edit, unassign, delivery progress and ETA), takeout/pickup orders (get, insert, edit, delete), carriers (list, add) and on-demand third-party delivery (availability estimates and assignment). 13 tools.

## Interface

Hand-written tools over `https://api.shipday.com`. Shipday publishes no single OpenAPI document: its docs (https://docs.shipday.com, index at https://docs.shipday.com/llms.txt) embed one small OpenAPI fragment per endpoint, so the 13 documented operations are written by hand from those pages. Request bodies are passed through as JSON in `body`; required fields are listed in each tool description.

## Auth

API key. Create or copy it in the Shipday Dispatch Dashboard under My Account. It is sent as `Authorization: Basic <key>`, using the key exactly as shown (no extra base64 encoding). Shipday has no user-created OAuth apps.

## Known gaps

Only endpoints in Shipday's published reference are included. Order lookup by id, order deletion, status updates and carrier removal are not documented there and are omitted. Webhooks (order status, driver location) are inbound and not exposed as tools. The edit-order path (`/order/edit/{orderId}`) is taken from the docs' server URL and curl example.
