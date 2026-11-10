# Zep

Zep Cloud context graphs and agent memory: projects, users, threads and messages, graph search and ingestion, nodes, edges, episodes, standalone graphs, custom instructions and context templates (about 64 tools).

**Interface:** hand-written tools over the Zep Cloud REST API at `https://api.getzep.com/api/v2`. Zep publishes no public OpenAPI document (the spec behind its Fern-generated SDKs is not served; `api.getzep.com/api/v2/swagger.json` requires a key), and its only public MCP server (`https://docs-mcp.getzep.com/mcp`) searches documentation rather than operating on data. Paths and methods were taken from Zep's official SDK ([zep-python](https://github.com/getzep/zep-python)) and the [API reference](https://help.getzep.com/sdk-reference/thread/get-threads). Tools take path IDs as arguments, `query` for query-string parameters and `body` for the JSON request body. Every non-GET call (including `graph.search`, which is a POST) requires approval.

**Auth:** project API key (`Authorization: Api-Key <key>`). Create it in the [Zep dashboard](https://app.getzep.com) under Project Settings, API Keys. Zep offers no OAuth.

**Known gaps:** the newer v4 endpoints (user groups, policy sets, batches, observations, thread and document summaries, task status, ontology under `set-ontology`) are not covered because they could not be verified against a published spec; the ontology endpoints used by the current SDK (`entity-types`) are omitted for the same reason. Request and response shapes are not typed; see the API reference.
