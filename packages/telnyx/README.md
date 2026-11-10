# Telnyx

Voice, messaging, phone numbers, SIP trunking, wireless, fax, verify, storage, networking and AI inference on the Telnyx platform: 1391 tools generated from Telnyx's official OpenAPI document, with every mutation requiring approval.

## Interface

OpenAPI 3.1, published by Telnyx at https://github.com/team-telnyx/openapi (`openapi/spec3.json`, fetched from raw.githubusercontent.com). Requests go to `https://api.telnyx.com/v2`. The document declares a separate bearer scheme per product area; they are all the same credential, so the package maps one bearer scheme to each auth method. Two operations are skipped (one with an unsupported auth method, one with an unsupported server protocol).

## Auth

- **API key**: create one at https://portal.telnyx.com/#/api-keys and paste it in as the token.
- **OAuth 2.0**: Telnyx publishes RFC 8414 metadata at `https://api.telnyx.com/.well-known/oauth-authorization-server` with dynamic client registration, so the connect page can register its own client. Register the redirect URI shown on the connect page if you use a manually created OAuth client. The package requests every scope the metadata lists: the read and write scope of each product area (billing and authentication_and_access are read-only). The OpenAPI document is fetched from the unpinned `master` branch of team-telnyx/openapi, so the tool set can change when the spec is regenerated.

## Gaps

Operations that use the machine-payment (`Payment`) scheme are not usable. The package does not include the separate Telnyx MCP servers.
