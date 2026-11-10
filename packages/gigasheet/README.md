# Gigasheet

Gigasheet is a spreadsheet-style platform for analyzing very large datasets. This package exposes its API: upload files and URLs, browse, filter, group and aggregate sheets, enrich and export data, manage filter templates, sharing, workspaces and the AI chat endpoints.

**Interface:** OpenAPI 3.0, Gigasheet's own API reference document (gigasheet.readme.io), fetched live from ReadMe's registry at `https://dash.readme.com/api/v1/api-registry/ek5819fmuyh0dhj`. The document declares its server as the protocol-relative `//api.gigasheet.com`, so `openapi.ts` sets `baseUrl` to `https://api.gigasheet.com`. 170 of the spec's 171 operations are exposed as tools. Every non-GET tool requires approval (123 mutations). This includes read-only POST endpoints such as `POST /library/search`, `POST /dataset/{handle}/query`, `POST /file/{handle}/aggregation`, `POST /dataset/{handle}/count/rows` and `POST /dataset/{handle}/activity/search`; they are gated conservatively because they are not GET.

**Not generated:** `POST /file/{handle}/filter/stream-progress`, whose only response is `text/event-stream` (SSE), which the framework does not support. The non-streaming `POST /file/{handle}/filter` covers filtering.

**Auth:** API key only (header `X-GIGASHEET-TOKEN`, matching `components.securitySchemes.ApiKeyAuth` in the spec). No user-created OAuth app is documented; the API key is the only documented method. API access must first be enabled for your account. Then open the Library, select Automation in the left navigation, and generate the key. The key is shown only once, and generating a new key invalidates the old one. See the [Gigasheet support article](https://support.gigasheet.com/support/solutions/articles/69000836344-gigasheet-api-for-big-data-automation).

**Stability risk:** the spec is a ReadMe api-registry id on dash.readme.com, not a download link published by Gigasheet. It was reachable without auth when this package was written, and the package loads it live at runtime, so a change or removal there would break tool generation.

**Cross-checks:** there is no integrations.sh domain record.

**Known gaps:** the SSE endpoint above. The health check calls `GET /user/whoami`.
