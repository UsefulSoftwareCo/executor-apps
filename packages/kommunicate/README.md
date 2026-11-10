# Kommunicate

Manage Kommunicate customer support conversations across human and AI agents: create conversations, send messages, change conversation status and assignee, and read or update users.

**Interface:** hand-written tools over the documented Platform API (`https://services.kommunicate.io`, reference at https://docs.kommunicate.io/docs/api-detail). Kommunicate publishes no OpenAPI document, and its official `kommunicate-mcp` is a local stdio Python server (six tools) with no remote URL, so the documented endpoints are wrapped directly: `createConversation`, `sendMessage`, `changeConversationStatus`, `changeConversationAssignee`, `updateUserDetails`, `getUserDetails`. All mutations require approval. Status values follow the official API docs (0 open, 2 closed, 3 spam); the community MCP README lists different numbers, which this package does not use.

**Auth:** API key. Find it in the Kommunicate dashboard under Settings, Install, API Key. It is sent in the `Api-Key` header. Kommunicate has no OAuth.

**Icon:** the Kommunicate speech-bubble app icon (256px webclip PNG) from kommunicate.io; the mark is not in Simple Icons.

**Known gaps:** attachment sending (`/rest/ws/message/send`) is not exposed because it needs a blob key from a separate upload flow and a super admin `of-user-id`. The docs do not describe response bodies, so results are returned as raw JSON. There is no documented read-only account endpoint or list-conversations endpoint; the health check looks up a placeholder user id.
