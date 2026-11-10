# CallPage

Place website callbacks and manage CallPage: call history, users, widgets, managers, and voice and SMS messages.

**Interface:** hand-written tools over CallPage's official REST API, documented at https://callpage.github.io/documentation-rest/ (base `https://core.callpage.io/api/v1/external`; call history and single calls use `/api/v3/external`). CallPage publishes no OpenAPI document or MCP server. 29 tools are grouped as `calls`, `users`, `widgets`, `managers`, `voice` and `sms`; every mutation needs approval.

**Auth:** API key only. Create and copy it at https://core.callpage.io/settings/api (a global key reaches all widgets, calls and users; per-user tokens are limited by scope: calls.view, managers.view/edit, sms.view/edit, voice.view/edit, widgets.view/edit, widgets.call). The key is sent in the `Authorization` header with no `Bearer` prefix. CallPage does not offer OAuth.

**Known gaps:** create and update tools for users, widgets, managers, voice and SMS take a free-form `body` or `fields` object holding the documented request fields, rather than a typed schema per field.
