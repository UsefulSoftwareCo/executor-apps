# Sendbird

Sendbird Chat Platform API: users, group channels, open channels, messages, moderation (ban, mute, freeze, report), announcements, bots, metadata and statistics.

**Interface:** the OpenAPI document Sendbird publishes inside its official Platform SDK repository, `https://raw.githubusercontent.com/sendbird/sendbird-platform-sdk-java/58d2d7d4e8c6bbece5cc0536633752a166be6a5d/api/openapi.yaml`, loaded live and compiled into 92 tools (63 mutations, every one asking for approval). Calls go to `https://api-<applicationId>.sendbird.com`. The document declares no security scheme (only an optional `Api-Token` header parameter on each operation), so the package patches every operation to use an `Api-Token` apiKey header and hides the parameter from tool inputs.

**Auth:** API token. In the Sendbird Dashboard open your application, go to **Settings > Application > General** and copy the Application ID and the master API token (or a secondary token). Enter both. Sendbird has no user-created OAuth apps for the Platform API.

**Known gaps:**

- Only the Chat Platform API is covered. Sendbird's Calls, Desk and Business Messaging APIs are separate products; only the chat spec was found in the official SDK repository, so they are not included.
- The spec is pinned to commit `58d2d7d4` (2026-03-30) of the SDK repository so the path-keyed patches stay valid; newer API operations require bumping the commit and re-verifying the patches.
