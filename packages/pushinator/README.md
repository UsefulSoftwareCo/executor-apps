# Pushinator

Send push notifications to Pushinator channels (iPhone, iPad, Android) and manage channels. Tools: `notifications.send`, `channels.create`, `channels.list`, `channels.get`, `channels.update`, `channels.delete`, `user.current`.

**Interface:** hand-written tools over the REST API at `https://api.pushinator.com/api/v2`. Pushinator publishes no OpenAPI document or MCP server. https://pushinator.com/api documents only `POST /notifications/send` and `POST /channels`. The other five tools (list/get/update/delete channel, get current user) are undocumented: unauthenticated probes show the routes exist (`GET /channels`, `GET|PUT|DELETE /channels/{id}` and `GET /user` answer 401, while unknown paths such as `/me` or `/zzzz` answer 404), but request and response shapes could not be confirmed without a token, so responses are returned as raw JSON and `update` sends `name` and `description` as the create call does. If any of them fail, the path or body is the first thing to check.

**Auth:** API token (bearer). Create it in the Pushinator Console at https://console.pushinator.com. No OAuth.

**Health check:** `GET /api/v2/channels` with the token; any 2xx is healthy and the body is not decoded, since its shape is undocumented. A bad token returns 401.

**Approvals:** send, create, update and delete require approval; list, get and current user do not.

**Gaps:** no subscribers or notification history, since none is documented.
