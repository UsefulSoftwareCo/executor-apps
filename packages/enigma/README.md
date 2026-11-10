# Enigma

Enigma provides data on U.S. businesses: brands, legal entities, operating locations, card revenue, and the KYB and screening data built on its graph model.

**Interface:** GraphQL, `https://api.enigma.com/graphql` (docs: https://documentation.enigma.com/guides/graphql/api, schema reference: https://documentation.enigma.com/reference/graphql_api). Enigma publishes no OpenAPI document, so the tools are generated from the GraphQL schema, one per root field (`query_<field>`, `mutation_<field>`). Mutations require approval.

Per the schema reference, the expected tools are `query_search` (the main entry point, `search(searchInput)`), `query_account`, `query_getListMaterialization` (deprecated), and the mutations `mutation_createList`, `mutation_updateList`, `mutation_deleteList`, `mutation_createListMaterialization`, `mutation_cancelListMaterialization`, `mutation_updateListMaterialization` and `mutation_createSuggestion`. The reference page was truncated, so the Query root may hold more fields. The exact list is only confirmed at connect time because introspection needs a key (unauthenticated requests return 401).

**Alternative: remote MCP server (beta).** Enigma documents a remote MCP server (https://documentation.enigma.com/guides/ai-mcp) with about 14 higher-level tools (`search_business`, `search_person`, `get_brand_locations`, `get_brand_card_analytics`, `get_brand_legal_entities`, `search_negative_news`, `search_gov_archive`, `search_kyb`, `screen_customer`, `screen_business`, `screen_entity_search`, `find_decision`, `find_decisions`, `update_decision`). Per the Claude Code guide it is at `https://mcp.enigma.com/http-key` (streamable HTTP, header `x-api-key`) or `https://mcp.enigma.com/http` (OAuth via `https://oauth.enigma.com`). This package is not mounted on it. Trade-off: the MCP tools are task-shaped (KYB, screening, decisions) and easier for an agent to use, while GraphQL is Enigma's primary API and exposes a few generic roots (a flexible `search` plus list management) that need more query-building. The MCP is still beta; mounting it under an `mcp` key is a reasonable follow-up.

**Auth:** API key. Create one in the Enigma console (https://console.enigma.com, Settings > Account > API keys); it is sent in the `x-api-key` header. Enigma's GraphQL API offers no OAuth.

**Known gaps:** tool list unconfirmed until connect time (see above). The legacy v1 REST API (match/id endpoints) is not covered; Enigma documents it as legacy for existing customers.
