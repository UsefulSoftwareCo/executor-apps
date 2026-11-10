# TextIt

Covers TextIt's REST API v2: contacts, groups, contact fields, flows and flow starts, runs, messages, broadcasts, labels, campaigns and events, tickets and topics, resthooks, globals, channels, users, archives and the workspace.

**Interface:** hand-written tools over `https://textit.com/api/v2/*.json`. TextIt publishes documentation at https://textit.com/api/v2/ but no OpenAPI document, so each endpoint is a tool taking a `query` object (filters, or the selector for an update or delete) and, for writes, a `body` object. Every write asks for approval.

**Auth:** API token only; TextIt has no OAuth. Create a token in your TextIt workspace settings. It is sent as `Authorization: Token <token>`.

**Known gaps:** media upload (`/media`, multipart) is not exposed. Workspaces on other TextIt hosts (for example self-hosted RapidPro) are not supported; only `textit.com`.
