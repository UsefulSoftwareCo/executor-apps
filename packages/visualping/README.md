# Visualping

Monitor web pages for visual, text and content changes with Visualping: describe the account, list, inspect, create, bulk-create, update, run and delete monitors, read check history and the workspace activity feed, and manage labels and saved presets.

**Interface:** hand-written tools over Visualping's REST API (`https://job.api.visualping.io` and `https://account.api.visualping.io`). Visualping's official OpenAPI document (https://develop.api.visualping.io/data/openapi-definition.yaml) covers only 6 operations (describe-user plus 5 job operations) spread over two origins, so it is not used. The tools follow that document plus a non-official reference, https://github.com/webmonitoring/visualping-api-skill/blob/develop/reference/api-reference.md. That repository is under the `webmonitoring` GitHub account, links to Visualping's developer pages and support address, and describes itself as a rapidly evolving API skill, but it does not state that Visualping maintains it; treat it as a community-maintained reference. Some request bodies are passed through as JSON objects; the tool descriptions list the fields.

**Auth:** API key (`Authorization: Bearer <key>`). Create one in Visualping under Account Settings > Developer (https://visualping.io/account/developer); an account can have up to 5 active keys, and API keys default to the EDITOR role for preset operations. Visualping has no OAuth for third-party apps.

**Gaps:**
- Visualping also publishes a remote MCP endpoint (`https://visualping.io/mcp/sse`); it answers 401 with no OAuth challenge, so it is not used.
- Business users must pass `workspaceId` (find it with `describeUser`); labels and presets are organisation-scoped and take `organisationId`.
- Running a monitor (`jobs.run` with `dryRun: false`) spends credits. `jobs.activityFeed` is read-only even though it uses POST, and is approval-gated like other POST tools.
- Diff and screenshot retrieval endpoints are not covered.
