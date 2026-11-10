# Scale AI

Manage Scale AI data labeling work: projects, batches and tasks (create any task type, list, read results, cancel, tag, set metadata and unique ids), batch prioritization, plus the team member list. 21 tools.

**Interface:** hand-written tools over the REST API at `https://api.scale.com/v1`. Scale publishes no OpenAPI document, MCP server or GraphQL API; the endpoints follow https://api-reference.scale.com/docs/api-reference/introduction-to-scale-api. `tasks.create` takes the task type and a JSON body, so every task type in Scale's reference (image, video, lidar, text collection, and so on) works without a tool each.

**Auth:** API key only (`apiKey`). Scale uses HTTP Basic auth with the key as the username and an empty password; the package builds the header. Create or copy the key from your Scale dashboard (https://dashboard.scale.com); Scale's API reference describes the key but not its exact location in the dashboard, so the menu path is not documented here. Test-mode and live-mode keys are separate environments: live-mode tasks are done by humans and billed. Scale offers no OAuth for the API.

**Known gaps:** the GenAI Data Engine / GenAI Platform / Nucleus / Taxonomy APIs, and file upload endpoints are not covered. Mutations require approval. 

**Unverified details:** `teams.list` calls `GET /teams`, an undocumented endpoint absent from Scale's public reference (other clients list it). `tasks.removeTags` sends `DELETE /task/{id}/tags` with a JSON array body matching add-tags; Scale's example shows no body. `projects.list` sends `archived` as a query parameter, which the docs do not specify. `batches.prioritize` sends `{"priority": n}` (10 to 30); the reference labels the body field `batchName` but its description and example use `priority`, so the example is followed.

**Icon:** the official 384px app icon from scale.com's web manifest (`/static/global/favicon/v3/android-chrome-384x384.png`); no official SVG mark was found.
