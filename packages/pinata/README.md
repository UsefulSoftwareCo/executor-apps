# Pinata

Manage Pinata IPFS storage: files, groups, gateways and access links, signed upload URLs, API keys, legacy pinning (pin by CID, pin list, metadata) and x402 payment instructions.

**Interface:** OpenAPI. Pinata's own docs repository (https://github.com/PinataCloud/docs, served at https://docs.pinata.cloud/) publishes four specs, each mounted under its own key in one router: `files` (`pinata-api-v3.yaml`, 50 tools), `ipfs` (`pinata-api-ipfs.yaml`, 19), `uploads` (`pinata-api-v3-uploads.yaml` on `uploads.pinata.cloud`, 5) and `x402` (`pinata-x402-api-v3.yaml`, 8). 82 tools in total. The `pinata-x402-api-v1.yaml` spec is not mounted.

**Auth:** API key only. Pinata has no user-created OAuth apps. Create a key at https://app.pinata.cloud/developers/api-keys and paste the JWT. Mutations ask for approval. Health check calls `GET https://api.pinata.cloud/data/testAuthentication`.

**Known gaps:** Pinata's gateway URL (`<name>.mypinata.cloud`) and other gateway content downloads are not covered; the specs cover the API hosts `api.pinata.cloud` and `uploads.pinata.cloud` only.
