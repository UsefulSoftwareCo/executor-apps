# Bubble

Search, read, create, update, replace and delete records in a Bubble app through its Data API, run exposed backend API workflows (POST or GET) through the Workflow API, and read the app's own Swagger document (`meta.swagger`) to learn its type and workflow names.

**Interface:** hand-written tools over the documented REST API (https://manual.bubble.io/core-resources/api/the-bubble-api/the-data-api/data-api-requests). Bubble publishes no single OpenAPI document: each app generates its own Swagger at `https://<app>.bubbleapps.io/api/1.1/meta/swagger.json`, which is why the tools are generic over data type (`type` argument) and workflow name. Ten tools: `things.list/get/create/bulkCreate/update/replace/delete`, `workflows.run` (POST, JSON body), `workflows.runGet` (GET, querystring), `meta.swagger`. Bubble lets each API workflow choose GET or POST, so use the one the workflow is configured for.

**Why not Bubble's official MCP server:** Bubble runs one at https://mcp.bubble.io/mcp (https://manual.bubble.io/help-guides/ai/bubble-mcp, OAuth). It is aimed at building apps, and its record tools (search/create/update/delete thing) reach only the development database and act as the signed-in user, so they cannot read or write the live database. The Data API tools here can target either version, so they were chosen instead.

**Auth:** API token. In the Bubble editor open Settings > API, enable the Data API and/or Workflow API, mark each data type you want reachable as active in the Data API settings, generate an API token, and deploy to live if you use the live version. Connect with:

- App URL: `https://<app>.bubbleapps.io` (add `/version-test` for the development version; a trailing `/api/1.1` is accepted).
- API token (sent as `Authorization: Bearer`).

The Data API uses no OAuth (the official MCP does, but is not used here).

**Security:** the Settings > API token is an admin token. Per Bubble's manual (https://manual.bubble.io/core-resources/api/the-bubble-api/the-data-api/authentication) it gives "full administrator access to your database" and privacy rules are ignored. Treat it as full database access. Only mutations (create, bulkCreate, update, replace, delete, workflows.run, workflows.runGet) require approval; reads (list, get, meta.swagger) do not. Prefer a development-version (`/version-test`) token or a separate token per app.

**Known gaps:** apps on a custom domain are not supported, because credentials may only go to the declared host `*.bubbleapps.io`. Workflow parameters and field values are passed as free-form JSON; they are not typed per app. `bulkCreate` takes up to 1,000 records and Bubble gives a request 4 minutes; the tool sets no timeout of its own and the Executor `execute` limit of 5 minutes covers it.
