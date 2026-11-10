# Shopify

Products, orders, customers, inventory, collections, discounts, fulfillment and the rest of a shop's Admin GraphQL API. Every query and mutation field in the shop's schema becomes a tool; mutations ask for approval.

## Interface

Shopify Admin GraphQL API, version `2026-07`: `https://<shop>.myshopify.com/admin/api/2026-07/graphql.json` (<https://shopify.dev/docs/api/admin-graphql>). The schema is introspected live per shop, so tools match the connected shop and app scopes; check the count after connecting by listing the app's tools (search `shopify` in Executor). Shopify's legacy REST Admin API is not exposed; GraphQL covers it and is Shopify's primary API.

## Auth

- **Admin API access token** (`shpat_...`): a static token is only available from legacy custom apps created before 2026-01-01, which can still be managed in the shop admin under Settings, Apps and sales channels, Develop apps. Shopify no longer lets merchants create new legacy custom apps there; new custom apps are made in the Dev Dashboard (<https://dev.shopify.com>) and give a Client ID and Client Secret, not a `shpat_` token ([Shopify Help: custom apps](https://help.shopify.com/en/manual/apps/app-types/custom-apps)). Enter the shop (`<shop>` of `<shop>.myshopify.com`) and the token. The token is sent as the `X-Shopify-Access-Token` header to `*.myshopify.com` only.
- **Dev Dashboard client credentials cannot be used directly.** The Client ID and Secret must first be exchanged by you with `POST https://<shop>.myshopify.com/admin/oauth/access_token` (`grant_type=client_credentials`, `client_id`, `client_secret`). The resulting token expires after 24 hours (`expires_in` 86399) and must be re-minted and re-entered, and the grant only works for stores in the same Dev Dashboard organization (otherwise `shop_not_permitted`) ([client credentials grant](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens/client-credentials-grant)).

Practical consequence: the most common current setup (Dev Dashboard app, 24-hour tokens) needs manual re-minting, so this package is practical mainly for legacy `shpat_` tokens or short-lived manual tokens.

## Known gaps

- No automatic token minting or refresh: OAuth (authorization code and client credentials) is not offered. Shopify's authorize and token endpoints are per-shop (`https://<shop>.myshopify.com/admin/oauth/...`), and the framework only accepts static endpoint URLs.
- Storefront, Customer Account and Partner APIs are not included.
- The pinned API version needs a bump as Shopify retires old versions.
