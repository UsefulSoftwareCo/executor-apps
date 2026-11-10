# Ringover

Covers the Ringover cloud phone system through its Public API v2: calls and call control, contacts, SMS, call campaigns, users, groups, numbers, IVRs, scenarios, conversations, tags, blacklists, conferences, transcriptions and Empower call analytics.

Interface: OpenAPI, loaded live from Ringover's official document at https://public-api.ringover.com/v2/openapi.json (API reference: https://developer.ringover.com). The document declares no servers or security schemes, so the package supplies the base URL (`https://public-api.ringover.com/v2`) and the auth scheme itself. Mutations require approval.

Auth: API key only. Create one in the Ringover dashboard under Developer > API keys (admin access required; the key is a 40-character hex string). It is sent as the raw `Authorization` header value, without a `Bearer` prefix. Ringover offers no user-created OAuth apps for the public API, so OAuth is not offered.

Known gaps: some endpoints may be unavailable depending on your Ringover plan (for example Empower analytics). Health check reads `/v2/teams`.
