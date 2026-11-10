# Vaquill

Search and read US primary law with Vaquill: federal and state statutes, regulations, court rules, constitutions, Federal Register material, agency guidance, sentencing guidelines, tax treaties, agency adjudications (for example MSPB, NLRB, SEC, OLC and BIA decisions), session laws, Bluebook citation resolution, section history, cross-references and definitions, plus credit balance and change watches (webhook alerts when a board changes).

**Interface:** OpenAPI, the vendor's official document at https://api.vaquill.ai/external/openapi.json (30 paths). Mutations (creating, updating, deleting and testing watches, and metered search or batch calls that POST) require approval.

**Auth:** API key. Sign in (or sign up) at https://app.vaquill.ai/auth/login and create an API key from your account (`vq_key_...`; the exact dashboard location is not documented in the API reference); it is sent as `Authorization: Bearer`. Vaquill offers no OAuth. API calls spend credits on the key's account.

**Known gaps:** The public API has no court opinions and no general case law; it does cover statutes, regulations and agency adjudications. The vendor's MCP server (https://mcp.vaquill.ai/mcp) wraps the same API and was not added.
