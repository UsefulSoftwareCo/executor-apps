# Pumble

Send and read messages in Pumble: channel messages, replies, direct and group DMs, reactions, scheduled messages, message search, threads, channels, channel membership, users, user groups and custom status.

**Interface:** OpenAPI 3.0 for Pumble's official API Keys addon ("Pumble API Addon documentation", 26 operations). Pumble publishes this document only inline in the Scalar page at https://pumble-api-keys.addons.marketplace.cake.com/api-docs/ (no standalone file URL), so the document is embedded in `openapi.ts`. Requests go to `https://pumble-api-keys.addons.marketplace.cake.com`. Help article: https://pumble.com/help/integrations/automation-workflow-integrations/api-keys-integration/

**Auth:** API key. In Pumble, click "+ Add apps", install the "API" app, allow permissions, open "API" in the sidebar and choose "Add API key" (or run `/api-keys generate`). The key is sent in the `ApiKey` request header. Listings are limited to the channels and DMs of the key's creator; reading private channels also requires the Addon Bot to be a member. Rate limit is 1000 requests per minute per user. The vendor's API Keys documentation describes only the API key method.

**Known gaps:** only what the API Keys addon exposes; no file upload, no webhooks or events. Private channel message listing requires the Addon Bot to be a member. Spec has no operationIds, so tool names derive from path and method. The spec has no response schemas; the health check (`GET /myInfo`) decodes only `id`, which is present in the vendor's example payload. `searchMessages` is a POST read, so it is approval-gated like the other non-GET operations. No other official Pumble API or MCP server was found.
