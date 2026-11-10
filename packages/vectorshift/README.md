# VectorShift

Run and manage VectorShift AI pipelines, knowledge bases, chatbots and transformations: list, create, fetch, bulk run, pause, resume, terminate and delete pipelines; create, index, query and delete knowledge bases and their documents; upload files to chatbots and manage them; run and manage code transformations. 28 tools, mounted as `pipelines`, `knowledgeBases`, `chatbots` and `transformations`.

**Interface:** OpenAPI. VectorShift publishes one official spec per resource alongside its REST API reference, all for `https://api.vectorshift.ai/v1`: `https://docs.vectorshift.ai/api-reference/pipelines/pipeline.json`, `.../knowledge-bases/knowledge_base.json`, `.../chatbots/chatbot.json` and `.../transformations/transformation.json`. The API is documented as beta.

**Auth:** API key. In VectorShift click the logo (top left), open Profile, then the API Keys tab and press "+". The key is sent as `Authorization: Bearer <key>`.

**Known gaps:** The vendor's `api.vectorshift.ai/openapi.json` also lists a large internal FastAPI surface (agents, forms, integrations, webhooks and more, under `/api/*` with a `Private-Key` header). It is undocumented, so it is not used. Agents, tables and integrations are therefore not exposed. Pipeline run (`POST /pipeline/{id}/run`) and chatbot run (`POST /chatbot/{id}/run`) are not exposed because they stream `text/event-stream` responses, which tools cannot return, so the compiler drops them (28 tools = 30 spec operations minus these 2). Mutating operations ask for approval. Health check calls `GET /pipelines`.
