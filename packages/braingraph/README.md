# BrainGraph

Search a BrainGraph knowledge graph (facts and entities built from documents, meeting transcripts, web pages and videos) and ingest new material: text, files, web page URLs, audio URLs and YouTube videos. Also lists brains and documents.

Interface: BrainGraph's official remote MCP server at `https://mcp.itsbraingraph.ai/mcp`, documented on the Claude connector page (https://itsbraingraph.ai/docs/claude-connector). It documents 11 tools (search_brain, resolve_entity, list_documents, get_document_images, upload_text, upload_to_brain, upload_document, upload_url, upload_youtube_url, upload_audio_url, list_brains); tools are discovered from the server at runtime. Every tool that is not marked read-only requires approval. BrainGraph publishes no OpenAPI or Swagger document (the REST reference at https://itsbraingraph.ai/documentation is prose only), so the earlier hand-written REST tools were dropped: the MCP covers the same operations plus images and agents, and the server's tool set stays current without maintenance.

Auth: OAuth. The server supports dynamic client registration with S256 PKCE and the scopes `brain:read`, `documents:write` and `brain:agents`; Executor discovers it from `https://mcp.itsbraingraph.ai`, so there is no OAuth app to create. Redirect URI: use the one Executor shows when connecting. The REST API keys (`bg_...`, `X-API-Key`) are not accepted as a second method because the MCP documents only OAuth, so API-key-only users have no path here.

Known gaps: uploads count against the plan's cap (free: 40 lifetime, Pro 60/month, Max 100/month) and the vendor's rate limits apply (100 writes and 200 reads per hour, 20 URL or YouTube submissions per 5 minutes).
