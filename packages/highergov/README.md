# HigherGov

Government market intelligence from HigherGov: federal and state/local opportunities, federal contracts, IDVs, grants and grant programs, subcontracts and subgrants, awardees, agencies, contract vehicles, people, NAICS/PSC codes, NSNs, documents and pursuits. 19 read-only tools.

**Interface:** OpenAPI 3.0, HigherGov's official schema at https://www.highergov.com/api-external/schema/ (endpoint docs at https://docs.highergov.com/import-and-export/api). The schema declares the key as a required `api_key` query parameter on every operation and lists no servers; `openapi.ts` patches each operation to take the key from the account (so it is never a tool argument) and sets the base URL to `https://www.highergov.com`. Five paginated list responses reference schema names containing a space, which the generator cannot resolve, so their response schemas are patched to free-form objects.

**Auth:** API key only. In HigherGov, sign in as an account admin, open the gear icon, choose API, and press Generate Key; the key is shown once. The key is sent as the `api_key` query parameter. HigherGov has no OAuth.

**Gaps:** the API is read-only. Base subscriptions include 10,000 records per month; larger use needs HigherGov's approval. The icon is HigherGov's GitHub organization avatar, since its site publishes only a wordmark SVG.
