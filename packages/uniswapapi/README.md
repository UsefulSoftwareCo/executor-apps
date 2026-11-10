# Uniswap API

Uniswap Labs Trading API: quotes, swaps (classic, UniswapX, 5792/7702/4337 flows), orders, Permit2 approvals and permissions, limit order quotes, supported chains and tokens, plans, wallet delegation and margin markets. Tools are generated live from Uniswap's official OpenAPI document at https://trade-api.gateway.uniswap.org/v1/api.json (base URL https://trade-api.gateway.uniswap.org/v1).

## Auth

API key only (`x-api-key` header). Request a key from the Uniswap developer portal at https://developers.uniswap.org. Uniswap offers no user-created OAuth apps. This package never signs or broadcasts transactions; swap and order tools return calldata that the user's wallet must submit.

## Known gaps

The 7 `/lp/*` liquidity-provisioning operations live on a different origin (https://liquidity.api.uniswap.org) and are skipped as `multiple_hosts`. Mutating operations (most POSTs, including `quote`) require approval.

Excluded as vendor-internal: the spec marks `POST /limit_order_quote`, `POST /swap_4337`, `POST /check_approval_4337`, `POST /wallet/encode_4337`, `GET /margin/markets`, `GET /margin/positions` and `POST /margin/quote` with `x-internal: true`, and its description tells agents not to use them. They are removed with OpenAPI patches. The x-internal request fields `walletExecutionContext` and `earnIntent` (QuoteRequest) and `sponsorshipInfo` and `approvalOnly` (CreateSwap5792Request) are removed too. The `swapStepsEnabledHeader` and `experimentalRoutingHeader` parameters on `POST /quote` remain because the patcher cannot remove array-indexed parameters; do not send them. Other x-internal response fields and schemas remain in the spec but are never requested. Icon source: https://raw.githubusercontent.com/Uniswap/interface/main/apps/web/public/favicon.png.
