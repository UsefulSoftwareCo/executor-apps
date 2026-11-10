# Alchemy

Blockchain data and node access through Alchemy: Ethereum-compatible JSON-RPC (reads, receipts, logs, `eth_call`, gas estimates), Alchemy enhanced methods (asset transfers, token balances and metadata, transaction simulation, tracing), the NFT API (ownership, metadata, floor prices, spam), the Prices API (current and historical), and the multi-chain Portfolio Data API (tokens, balances, NFTs, transfers by wallet address).

## Interface

Hand-written tools over Alchemy's documented HTTP APIs.

Why not the official OpenAPI set (https://github.com/alchemyplatform/docs/tree/91bd5fd7c22e89afee9d300373ba7322f4577ecd/src/openapi, specs for nft, prices, portfolio, transactions): the API key is a `{apiKey}` path parameter in every operation and servers are templated per network and per host (`{network}.g.alchemy.com`, `api.g.alchemy.com`). The generated surface would make the agent supply `apiKey` on each call instead of using the connected account, and the single-origin / `multiple_hosts` check in `scripts/tools.ts` cannot hold across these hosts. These tools take the key from the connected account and build the URL themselves. Endpoints and parameters follow those specs.

Why not Alchemy's official hosted MCP server (https://mcp.alchemy.com/mcp, about 168 tools): `scripts/mcp-probe.ts` returns 401 with verdict `oauth` (authorization server https://auth.alchemy.com), so it is OAuth-only with no API-key option, requiring an Alchemy dashboard login rather than an app key. Its RPC and data tools also depend on a stateful `select_app` call that caches the app's key for the MCP session, which does not fit stateless per-call account tools. It adds Solana RPC/DAS, smart wallet and ERC-4337 tools; those are reachable here only through `rpc.call_any`. Revisit if Alchemy adds key-based MCP auth.

- `rpc.*`: `https://<network>.g.alchemy.com/v2/<key>`. Typed read tools plus `rpc.sendRawTransaction` and `rpc.call_any` (any method, including Solana; both need approval).
- `nft.*`: `https://<network>.g.alchemy.com/nft/v3/<key>/...`
- `prices.*`: `https://api.g.alchemy.com/prices/v1/<key>/...`
- `portfolio.*`: `https://api.g.alchemy.com/data/v1/<key>/...`

Every chain-specific tool takes a `network` slug such as `eth-mainnet`, `base-mainnet` or `arb-mainnet`. The key must have that network enabled in its Alchemy app.

## Auth

API key. Create an app in the Alchemy dashboard (https://dashboard.alchemy.com/apps), choose the networks, and copy its API key. Alchemy has no OAuth for these APIs.

## Known gaps

- Webhooks (Notify) and the Admin/Gas Manager APIs use a separate dashboard auth token (`dashboard.alchemy.com`, `manage.g.alchemy.com`) and are not included.
- Smart Wallet, bundler and Account Abstraction methods are reachable only through `rpc.call_any`.
- The Prices and Portfolio tools take the request `body` as documented rather than a typed schema.
