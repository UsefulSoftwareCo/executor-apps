# Gerrit

Gerrit Code Review on any Gerrit server (self-hosted or hosted): changes, reviews and inline comments, reviewers, attention set, revisions, files and diffs, projects, branches, tags, accounts and groups, and server info.

**Interface:** hand-written tools over Gerrit's REST API (https://gerrit-review.googlesource.com/Documentation/rest-api.html). Gerrit publishes no OpenAPI document and no official MCP server, so each tool is one documented REST endpoint, called under the authenticated `/a/` prefix. Responses are unwrapped from Gerrit's `)]}'` XSSI prefix.

**Auth:** HTTP credentials (HTTP Basic). Enter the server address (for example `https://gerrit.example.com`, including any path such as `/gerrit`), your username and an HTTP password generated under Settings > HTTP Credentials in the Gerrit web UI. Gerrit has no user-created OAuth apps, so there is no OAuth method. The provider declares no static `hosts` because every server has its own address; the app only sends credentials to the server named on the account, and plain http is accepted only for localhost.

**Gaps:** what a tool may do depends on the account's permissions and the server's plugins; server-admin endpoints (summary, tasks, caches, plugins) need administrator capabilities. Plugin REST APIs, change edits, access-rule editing, group audit mutation and attachment uploads are not covered. File contents and patches are returned base64-encoded as Gerrit sends them.
