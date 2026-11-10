# Skio

Skio subscription management for Shopify brands: subscriptions, billing attempts, customers, products, orders and discounts.

**Interface:** GraphQL, `https://graphql.skio.com/v1/graphql` (Hasura-style schema mirroring Shopify objects; docs at https://code.skio.com/). Tools are generated from the schema at runtime; every mutation requires approval. Skio limits queries to depth 4, 100 nodes per request, and 2000 requests per minute per token.

**Auth:** API token only (Skio has no OAuth). In the Skio dashboard click "API" in the left navigation, name a token and generate it. It is sent as `authorization: API <token>`.

**Icon:** Skio's official app icon (apple-touch icon from skio.com, 360px PNG).

**Known gaps:** the health check can only confirm the endpoint is reachable with the token, since Skio has no current-account query. Tool generation depends on introspection being enabled for the token; it was not verified because no real credentials were used.
