# JazzHR

Covers the JazzHR (formerly Resumator) applicant tracking API: applicants, applicant-to-job mappings and hires, jobs, categories, contacts, activities, notes, files, questionnaires and answers, tasks, users and workflows.

**Interface:** custom, hand-written tools with `fetch` (about 40). JazzHR publishes only a Swagger 1.1 description (https://www.resumatorapi.com/v1/resources.json and the per-resource documents beside it), not OpenAPI, and its list filters are URL path segments (`/applicants/city/Austin/page/2`), so the tools were written from that description against `https://api.resumatorapi.com/v1`. No GraphQL API or MCP server exists.

**Auth:** API key. In JazzHR open Settings, Integrations, API (https://app.jazz.co/app/settings/integrations) and copy the key. It is sent as the `apikey` query parameter. JazzHR offers no OAuth.

**Known gaps:** list tools return at most 100 rows, so pass `page` to read on. POST tools send a JSON body with the key in the query string; the vendor docs do not state the body encoding, so a create call may need adjusting if JazzHR rejects it. File contents cannot be downloaded (JazzHR locked `GET /files` downloads), and the v1 API does not trigger workflow automation. Every create tool requires approval. There is no update or delete endpoint in the API.
