# ParseHub

Run ParseHub web scraping projects and collect their data: list and inspect projects, start runs (with optional start URL, template or start-value overrides), check run status, fetch run data or the last ready run's data as JSON or CSV, and cancel or delete runs.

**Interface:** hand-written tools over the documented REST API v2 (`https://www.parsehub.com/api/v2`, reference at https://www.parsehub.com/docs/ref/api/v2/). ParseHub publishes no OpenAPI document, GraphQL API or remote MCP server. Tools: `listProjects`, `getProject`, `runProject`, `getLastReadyRunData`, `getRun`, `getRunData`, `cancelRun`, `deleteRun`. Mutations (`runProject`, `cancelRun`, `deleteRun`) require approval. The cancel and delete endpoints are not in the vendor's reference page; they come from ParseHub's API as exposed by third-party client integrations and are unverified against live calls.

**Auth:** API key. Find it in your ParseHub account settings at https://www.parsehub.com/account. It is sent as the `api_key` parameter (query string on GET/DELETE, form body on POST), as the API requires. ParseHub has no OAuth.

**Icon:** the ParseHub app mark from https://www.parsehub.com/static/images/phmini2.png (600px).

**Known gaps:** no project creation or editing (the API does not offer it). The `getRun` endpoint is rate-limited. The health check lists one project.
