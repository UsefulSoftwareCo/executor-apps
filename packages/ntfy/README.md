# ntfy

Send push notifications to phones and desktops through ntfy.sh. Covers publishing (title, priority, tags, actions, attachments by URL, scheduled delivery, e-mail and call forwarding), polling cached messages, clearing and deleting notifications, server health and config, and the signed-in account: quota, access tokens, topic reservations and subscriptions.

## Interface

Hand-written tools over ntfy's HTTP API. ntfy publishes no OpenAPI document, GraphQL API or MCP server, so the tools follow the vendor docs (https://docs.ntfy.sh/publish/, https://docs.ntfy.sh/subscribe/api/) and the endpoint list in the official server source (https://github.com/binwiederhier/ntfy/blob/main/server/server.go). 14 tools.

## Auth

Accounts always talk to hosted **https://ntfy.sh**. Each account uses one of:

- **Access token** (`tk_...`, sent as `Authorization: Bearer`). Create one in the ntfy web app under Account.
- **Username and password** (sent as HTTP Basic auth, UTF-8 encoded).

ntfy has no OAuth. Public topics still need a saved account for this app; use an access token or any valid user. The provider declares `hosts: ["ntfy.sh"]`, so app code only sees opaque credential handles and the network refuses to send them anywhere else. Because `hosts` is a static list, self-hosted ntfy servers are not supported.

## Known gaps

- Publishing is JSON-only; uploading a file body is not supported (use `attach` with a URL).
- Streaming subscriptions (SSE, WebSocket) are not possible; use `messages.poll` with `since` set to the last seen message id.
- Phone number and e-mail management, password changes, billing and admin user/ACL endpoints are not exposed.
- Token, reservation and subscription tools need a user account on ntfy.sh; they fail with 401/403 otherwise.
