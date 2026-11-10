# CoinGecko

Cryptocurrency prices, market charts, coin metadata, exchanges, derivatives, NFTs, categories and onchain (GeckoTerminal) DEX data from CoinGecko. All endpoints are read-only market data.

## Interface

OpenAPI, from CoinGecko's official specs in [coingecko/coingecko-api-oas](https://github.com/coingecko/coingecko-api-oas):

- `pro` mounts `pro-api.json` (https://pro-api.coingecko.com/api/v3), the full Pro API including onchain endpoints.
- `demo` mounts `demo-api.json` (https://api.coingecko.com/api/v3), the smaller set available to free Demo keys.

CoinGecko uses different hosts and header names per plan, so each plan is its own account type; connect whichever key you have.

## Auth

API key only (CoinGecko offers no OAuth). Create keys in the [CoinGecko developer dashboard](https://www.coingecko.com/en/developers/dashboard): a Demo key is free, Pro keys require a paid plan. The key is sent as `x-cg-pro-api-key` or `x-cg-demo-api-key`.

## Known gaps

None known. The specs are pinned to a commit of coingecko-api-oas but fetched at runtime. Some endpoints need higher Pro tiers than the connected key.
