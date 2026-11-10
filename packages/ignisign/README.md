# IgniSign

Electronic signatures with IgniSign: signature requests, documents, signers, signer profiles, user invitations, webhooks, signature lookups, M2M seals and log capsules.

## Interface

Custom. IgniSign publishes no OpenAPI document, so the tools are hand-written `fetch` calls against the v4 REST API at `https://api.ignisign.io`. The vendor's docs index (https://ignisign.io/docs/category/ignisign-api) does not list paths, so endpoints come from the official Node SDK v4.3.0 (https://github.com/ignisign/ignisign-node), not from per-endpoint vendor reference pages. No official OpenAPI document or MCP server was found (api.ignisign.io serves none). The application id and environment are parsed from the API key and filled into paths, so tools never ask for them. Request bodies are passed as `body` objects as described in the API reference.

## Auth

- API key (`apiKey`): the application API key, sent as `Authorization: Bearer <key>`. Create it in the IgniSign Console under the application's API Keys section; keys are per application and environment (`skv2_<env>_<appId>_<secret>`, the format the SDK README documents; the parser splits on `_` as the SDK does). Legacy `appSecret` keys that need a JWT exchange are not supported.

The only OAuth2 flow IgniSign has is signer-facing (bare-signature signer sessions); it is not offered for connecting an account, so it is not exposed.

## Known gaps

- Document authenticity check (`check-authenticity`) needs a multipart file upload and is not exposed.
- Signer identity-proofing-only sessions (`signers/:signerId/id-proofing`): the path is not confirmed in the SDK or vendor docs, so it is not exposed.
- File upload and binary download endpoints (document file, signature proof files, bare-signature proofs) are not exposed: they need multipart or binary bodies.
- Signer-facing endpoints that use single-use tokens are not exposed.
