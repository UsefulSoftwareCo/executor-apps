# Freepik

Covers the Freepik developer API, which Freepik now brands Magnific: stock resource search and download (vectors, photos, PSDs, icons, videos), and the AI endpoints for image generation (Mystic, Flux, Seedream and others), video generation, audio, upscaling and editing.

**Interface:** OpenAPI, the vendor's own document at https://storage.googleapis.com/fc-freepik-pro-rev1-eu-api-specs/magnific-api-v1-openapi.yaml (linked from https://docs.magnific.com/authentication). It is mounted live and yields 526 tools, none skipped. Requests go to `https://api.magnific.com`.

**Auth:** API key only. Create one in the Freepik/Magnific API dashboard (see https://docs.magnific.com/quickstart); it is sent in the `x-magnific-api-key` header. Keys look like `FPSX...`. Mutations require approval.

**Gaps:** Freepik also runs an OAuth-based remote MCP server at https://mcp.magnific.com; it is not mounted here because the OpenAPI covers the API more fully and the MCP server needs a client-registered OAuth flow. Generation endpoints are asynchronous and spend credits; poll the matching task endpoints for results.
