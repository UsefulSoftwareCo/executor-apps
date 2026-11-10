# Inblog

Manage an Inblog blog: posts (create, update, publish, tags, authors), tags, authors, blog settings, redirects, lead forms and responses, custom domain, design code, Search Console and traffic analytics.

Interface: OpenAPI, generated from Inblog's official document at https://inblog.ai/openapi.json (API base https://inblog.ai/api/v1). Only the production origin is allowed.

Auth: API key. Create one in the Inblog dashboard under Settings -> API Keys (https://inblog.ai/dashboard), choosing the permission scopes you need. It is sent as a Bearer token. Inblog's pricing page lists API access as included in the Team and Annual plans and not in Free. REST access is API-key only. Inblog's MCP connector (https://inblog.ai/api/mcp, 38 tools) uses its own OAuth sign-in, which this package does not use.

Known gaps: user-JWT endpoints such as `/user/blogs` expect a user JWT rather than an API key and will likely fail with an API key. Every mutation requires approval. The spec's API key scope list omits `forms:read`, `form_responses:read` and `blogs:code`, yet the form tools (listForms, getForm, listFormResponses, getFormResponse) and the design-code tools (getDesignCode, updateDesignCode, validateDesignCode) require them, so keys minted from the dashboard may not be able to call these tools. Not tested against a live key.
