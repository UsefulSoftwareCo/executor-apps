# Starshipit

Shipping with Starshipit: orders, labels and packing slips, rates, tracking, manifests, Product Catalogue, pickups, order documents, address book and tags (53 tools across 10 groups, covering the documented Starshipit API except binary document previews/downloads and the outbound webhook payload).

**Interface:** hand-written tools over the official REST API at `https://api.starshipit.com`. Starshipit publishes no OpenAPI document (only a Postman collection, mirrored at https://support.starshipit.com/developers/api-reference/starshipit), so the tools follow that reference. Complex request bodies are passed as a `body` object in the shape of the matching endpoint in the docs. The support center MCP server (`support.starshipit.com/mcp`) only searches help articles, so it is not used. The separate WMS API (`wms.starshipit.com`, different auth header) is not included.

**Auth:** API keys. In Starshipit open Settings > API and copy both the API key (sent as `StarShipIT-Api-Key`) and the Subscription key (sent as `Ocp-Apim-Subscription-Key`). Both must come from the same account. The subscription key sets rate limits (production access requires approval and uses a higher rate limit). The API has no OAuth.

**Approvals:** every mutation asks for approval. Rates and delivery services are POST endpoints that only price shipments, so they are queries.

**Known gaps:** `products.template` and `products.export` return their file as text in `content`; order documents are uploaded as base64 and sent as multipart/form-data; the vendor does not document the export format; order-document preview/download return binary files and are omitted; request bodies are untyped JSON.
