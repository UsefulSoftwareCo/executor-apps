# Bird

Bird (formerly MessageBird) is a communications platform. This package exposes the current Bird API: email messages, batches and broadcasts, SMS, WhatsApp, verification, realtime messaging apps and channels, and workspace settings.

Interface: OpenAPI, from Bird's official description at https://bird.com/openapi.json (about 520 operations). Mutations ask for approval.

Auth: API key. Create a workspace key (`bk_<region>_...`) in the Bird dashboard under Developers > API keys (https://docs.bird.com/api/api-access); an organization master key (`bm_<region>_...`) also works. The key goes in the `Authorization: Bearer` header. The region in the key prefix (`us1` or `eu1`) selects the host `https://<region>.platform.bird.com`, so no separate region field is needed. Bird has no user-created OAuth apps for this API.

Known gaps: the legacy MessageBird REST API (rest.messagebird.com, `AccessKey` auth) and Bird's hosted MCP server are not included. Operations that need cookie auth or the Realtime key/secret header pair are limited to what the workspace key permits.
