# More Trees

Plant trees with More Trees (THG Eco) and read its data: the connected account and credit balance, public forests, the active planting projects with their tree types, and tree planting for yourself or as gifts to recipients (with a dry-run `test` mode).

**Interface:** hand-written tools over the documented public API (https://www.moretrees.eco/learn/user-guides/api). More Trees publishes no OpenAPI document and no remote MCP server. The four documented endpoints are wrapped: `getAccount`, `getForest`, `listProjects` and `plantTrees`. `plantTrees` is a mutation and requires approval. The API spans three hosts (`user-management-service`, `project-management-service` and `transaction-management-service` under `platform.moretrees.eco`), all declared for credentials.

**Auth:** API key. In the More Trees platform, open Settings > Account Settings (https://platform.moretrees.eco/settings/?tab=account-settings) for the API key and the account code; enter both when connecting. The key is sent in the `X-API-KEY` header; the account code is the payment account for planting and the default for lookups. More Trees has no OAuth.

**Icon:** the "m:t" app icon from the vendor's own platform (`platform.moretrees.eco/images/apple-touch-icon.png`, 180px). The vendor publishes no SVG mark; its full logo is a wordmark.

**Known gaps:** the docs describe the project listing as using a "public validation key" without naming its header, so `listProjects` sends the API key and may need a different key on some accounts. The forest endpoint lists no auth requirement; the key is sent anyway. Rate limits are undocumented (429 is returned). No transaction history or certificate endpoints exist in the API.
