# NMKR Studio

Covers the NMKR Studio API for Cardano NFT projects: projects, NFTs and uploads, minting, sales and
payment transactions, payout wallets, mint coupons, rates and server state.

Interface: OpenAPI, the vendor's official v2 (mainnet) document at
https://studio-api.nmkr.io/swagger/v2/swagger.json. All calls go to https://studio-api.nmkr.io.

Auth: API key only (NMKR offers no user-created OAuth apps). Create one in NMKR Studio under
Account > Manage API Keys (https://studio.nmkr.io) and paste it; it is sent as `Authorization: Bearer <key>`.
Mutations require approval.

Known gaps: mainnet only. The testnet API (studio-api.preprod.nmkr.io) uses separate accounts and keys
and is not mounted. The deprecated v1 document is not used.
