# BugHerd

Visual feedback and bug tracking for websites: organization, projects, tasks, columns, comments, attachments, users (members and clients) and webhooks.

Interface: OpenAPI, from BugHerd's official API v2 document at https://docs.bugherd.com/api/openapi.yaml (41 tools, 19 of them mutations needing approval). BugHerd also runs a remote MCP server (https://mcp.bugherd.com/mcp, OAuth); it is not mounted. Its tools were not compared with the REST tools (the probe verdict is `oauth`, and the tool list needs an OAuth login), and it reportedly covers things the REST spec lacks such as tags, assignees and project create/update, so this is a known gap.

Auth: API key only. Create it in your BugHerd account. It is sent as the HTTP Basic username with the literal password `x`, as the API docs specify. BugHerd offers no user-created OAuth apps for the REST API, so there is no `oauth2` method.

Known gaps: the spec's overview says the REST API cannot delete tasks, comments, columns or users, yet the spec defines DELETE operations for tasks, columns and comments. Those generated delete tools are approval-gated but may fail at runtime. Health is checked against the spec's `{ organization: { id, name } }` shape and has not been run against a live account. Rate limit is 60 requests per minute (plus a 10 burst). The icon is BugHerd's official app icon (a PNG), since no SVG mark is published.
