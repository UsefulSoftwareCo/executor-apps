# RocketReach

Find and verify professional contact details with RocketReach: people search and lookup, company search and lookup, bulk lookup, lookup status polling, the Universal Credits variants of each, account/credit usage, and email verification (16 tools).

**Interface:** hand-written tools over the documented RocketReach API v2 (`https://api.rocketreach.co/api/v2`, reference at https://docs.rocketreach.co/). RocketReach publishes its OpenAPI definition only embedded in its docs pages (no stable spec URL), so the endpoints are wrapped directly with `fetch`. RocketReach also runs an official remote MCP server (`https://mcp.rocketreach.co/mcp`, OAuth 2.1 with dynamic client registration), but it exposes only 9 tools and requires OAuth, so the REST API is used instead. The vendor OpenAPI was checked and could not be fetched from a stable URL (docs.rocketreach.co/openapi paths 404), which justifies the hand-written tools; the REST API (16 endpoints) is also broader than the 9-tool MCP. Credit-consuming operations (all lookups, bulk lookups, email verify, and the Universal Credits searches) require approval; the free standard searches and account reads do not. `universal.account` decodes only declared fields so the account `api_key` in the raw response is never returned.

**Auth:** API key. Generate it under the "My API Key" section of your account's API page: https://rocketreach.co/account?section=nav_gen_api. It is sent in the `Api-Key` header. The REST API has no OAuth. The health check calls the free `GET /account/` endpoint.

**Icon:** RocketReach's official app icon (192px PNG from `static.rocketreach.co`); the mark is not in Simple Icons and the vendor publishes no SVG.

**Known gaps:** `POST /account/key/` (creating a new API key) and webhook management are not exposed. Search `query` objects are passed through as free-form JSON (see the tool descriptions for the keys); person lookups are asynchronous, so poll `personCheckStatus` or use a webhook id. `personCheckStatus` sends repeated `ids=1&ids=2` query parameters (OpenAPI default explode); the vendor docs do not state the array serialization explicitly.
