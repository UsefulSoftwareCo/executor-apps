# Bonsai

Bonsai (bonsai.io) is managed Elasticsearch and OpenSearch hosting. This package wraps its Cluster Management API: list, get, create, rename/resize and destroy clusters, plus read-only plans, spaces (regions) and releases. It is not the HelloBonsai freelancer product.

**Interface:** hand-written tools (11) over the REST API at https://api.bonsai.io. Bonsai publishes no OpenAPI document, no GraphQL API and no MCP server. Docs: https://bonsai.io/docs/api/overview/. The API is in Alpha upstream and may change.

**Auth:** API token (key and secret), sent as HTTP Basic credentials (key as username, secret as password). Create the token in the Bonsai app (app.bonsai.io) under your account's API tokens; the token reads `bonsai_<key>_<secret>`, so enter the key and the secret separately. Tokens carry scopes: plans, spaces and releases need `account:read`; listing and getting clusters needs `clusters:read`; creating, updating and destroying clusters needs `clusters:write`. A token may lack some of these, in which case the matching tools return 403. Bonsai offers no OAuth. The health check calls `GET /clusters`, so it needs `clusters:read`. The cluster list `page` and `size` parameter names are not documented by Bonsai (only the response `pagination` fields are) and are unverified.

Every mutation (create, update, destroy) requires approval.

**Known gaps:** this manages clusters only. It does not talk to a cluster's own Elasticsearch/OpenSearch endpoint (search, indexing); use that cluster's URL and credentials directly for data access. Rate limits are 60 requests per minute per token and 5 cluster creations per minute.
