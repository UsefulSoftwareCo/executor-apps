# You.com

Real-time web and news search, page contents extraction, cited answers, deep research (with background tasks) and finance research with the You.com API, plus credit balance and image search.

**Interface:** hand-written tools over the documented HTTP API (reference at https://you.com/docs/api-reference/, endpoints on `https://ydc-index.io` and `https://api.you.com`). You.com's OpenAPI links (`https://you.com/docs/openapi.json`) currently serve an HTML page rather than a spec, so it cannot be compiled. The official remote MCP server (`https://api.you.com/mcp`, OAuth) exposes only a few search and research tools, so the REST API is wrapped directly: `search`, `contents`, `answer`, `images`, `accountBalance`, `research.run`, `research.task` and `financeResearch`. The research mutations spend credits and require approval.

**Auth:** API key, created at https://you.com/platform (free credits included) and sent in the `X-API-Key` header. The MCP server's OAuth is not used. Health check reads the account balance.

**Icon:** the You.com mark, cropped from the logo on the vendor's own API docs site; it is not in Simple Icons.

**Known gaps:** the research task stream and cancel endpoints and the agents runs API are not exposed. `search`, `answer` and `contents` are queries but consume credits. Images is limited to early-access partners.
