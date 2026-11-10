# commercetools

Carts, orders, customers, products, categories, prices, inventory, discounts, shipping, payments, business units, quotes and the rest of the commercetools Composable Commerce HTTP API (822 tools, 356 of them mutations, each of which asks for approval).

**Interface:** OpenAPI, from commercetools' official API reference, https://github.com/commercetools/commercetools-api-reference (`oas/api/openapi.yaml`). That published file is not valid YAML for a strict parser (a multi-line quoted scalar under `BusinessUnitStatus` is under-indented), which the app loader rejects, so the document is vendored as `openapi.json`: the same file parsed by PyYAML and otherwise unchanged. Refresh it from the repository when the API changes.

**Auth:** one method, an API client (client credentials). Create it in the Merchant Center under Settings > Developer settings > Create new API client, choose the scopes the tools should have, and enter the region (`us-central1.gcp`, `us-east-2.aws`, `europe-west1.gcp`, `eu-central-1.aws` or `australia-southeast1.gcp`), the project key, the client ID and the client secret. The token endpoint depends on the region, so the app exchanges the client at `https://auth.{region}.commercetools.com/oauth/token` itself (HTTP Basic, no scope, so the token carries every scope the client has) and caches the token until shortly before it expires. There is no OAuth redirect. Credentials only go to the `api.{region}` and `auth.{region}` hosts of the five regions.

**Known gaps:** only the Composable Commerce HTTP API is mounted; the Import, Change History and Checkout APIs, the GraphQL endpoint and the Commerce MCP package are separate surfaces. Every operation takes the project key as a path argument; use the connected account's project key.
