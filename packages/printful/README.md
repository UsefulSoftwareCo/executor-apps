# Printful

Printful print-on-demand: orders, stores, the product catalog, sync products, the file library, shipping rates and cost estimates, the mockup generator, warehouse products, approval sheets, webhooks and reports.

## Interface

Two official OpenAPI documents from Printful, both mounted in one router:

- `v1`: https://developers.printful.com/docs/openapi.json (56 tools)
- `v2`: https://developers.printful.com/docs/v2-beta/openapi.json (52 tools, API v2 beta; paths under `/v2`)

Mutations require approval. Both documents declare only an OAuth scheme; the package maps it to a bearer token, which is how Printful accepts both private tokens and OAuth access tokens.

## Auth

- Private token: create it at https://developers.printful.com/tokens ("Your tokens") with the scopes you need (`orders`, `sync_products`, `file_library`, `webhooks`, each with a `/read` variant). A store-level token is tied to one store. Account-level tokens that manage several stores also need the `X-PF-Store-Id` header on store endpoints.

## Known gaps

- OAuth for public apps is not offered. Printful's authorize endpoint expects the parameter `redirect_url`, but Executor's OAuth flow sends the reserved name `redirect_uri` and does not allow renaming it. Use a private token instead.
- The health check reads the token's scopes (`GET /oauth/scopes`), so the connected account shows a generic name.
