# Chatwork

Chats, messages, tasks, files, members, invite links and contacts in Chatwork: 31 tools covering every documented Chatwork API v2 endpoint except file upload.

**Interface:** hand-written tools over the documented REST API (`https://api.chatwork.com/v2`, reference at https://developer.chatwork.com/reference/). Chatwork has no public GraphQL API or remote MCP server, and its OpenAPI definition is only published embedded in each reference page (no single document URL; the `chatwork/chatwork-api-spec` repository it names is not public), so `operations.ts` wraps the documented endpoints. Tools take path ids, a `query` object for GET filters, and a `body` object of form fields for writes (sent as `application/x-www-form-urlencoded`, as Chatwork requires; arrays are comma-joined). Every non-GET operation requires approval.

**Auth:** two methods.
- API token: each user has a personal token under Chatwork's profile menu > Service integration > API. It is sent in the `X-ChatWorkToken` header, never expires and has full access.
- OAuth 2.0 (authorization code, confidential client): create a client at https://www.chatwork.com/service/packages/chatwork/subpackages/oauth/client_create.php, choose "confidential client", add Executor's redirect URI (HTTPS, up to 5) and enable the scopes below. Enter the client ID and secret when connecting; the token endpoint uses HTTP Basic client auth. Requested scopes: `users.all:read`, `rooms.all:read_write`, `contacts.all:read_write`, `offline_access` (confidential clients only; without it refresh tokens expire after 14 days). Access tokens last 30 minutes and are sent as `Authorization: Bearer`.

**Icon:** the four-petal Chatwork app icon from the vendor's site (https://go.chatwork.com/en/image/common/touch-icon-ipad-retina.png, 152px); it is not in Simple Icons. Its navy petal is low-contrast on dark backgrounds.

**Known gaps:** file upload (`POST /rooms/{room_id}/files`, multipart) is not wrapped. Chatwork rate limits (300 requests per 5 minutes) apply. Nothing was run against a live account.
