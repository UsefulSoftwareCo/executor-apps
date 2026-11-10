# EchtPost

Send real, printed postcards with EchtPost: create cards (directly or from a template), check whether text fits, cancel unprinted cards, and manage contacts, groups, templates, motives and credits.

**Interface:** OpenAPI, loaded live from EchtPost's official v2 document, <https://api.echtpost.de/v2/openapi.json> (docs: <https://api.echtpost.de/v2/docs>). EchtPost also runs an official MCP server at `https://mcp.echtpost.de`, but it mirrors the REST API, so the OpenAPI route is used.

**Auth**
- API key: create one in your EchtPost account (Live or Sandbox; sandbox keys start with `ep_test_`, are not billed, and the mode cannot be changed later). Sent as `Authorization: Bearer <key>`.
- OAuth 2.1 with PKCE: endpoints are discovered from `https://my.echtpost.de`, which supports dynamic client registration, scope `api`. Add the redirect URI shown on the Executor connect page if you register a client by hand. OAuth sessions have no sandbox mode; real cards cost credits.

**Known gaps:** none known. All mutations (including creating cards) require approval. Webhooks (`card.sent`) are configured in EchtPost, not exposed as tools.
