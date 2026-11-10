# BSC Designer

Balanced scorecards in BSC Designer Online: documents (scorecards), KPI lists and trees, KPI values by date and period, targets, baselines, custom fields, strategy maps, organization info, report downloads and user documents. 45 tools, 20 of them mutations (each requires approval).

**Interface:** OpenAPI. BSC Designer's official Swagger 2.0 document, https://www.webbsc.com/v2/api-docs (Swagger UI at https://www.webbsc.com/swagger-ui.html, guide at https://bscdesigner.com/webbsc_manual/api.htm). The document declares no security scheme, only a required `token` header on every operation, so `openapi.ts` declares that header as the API-key scheme and removes the per-operation parameter. All operations are mounted.

**Auth:** API key only (the service has no OAuth). In BSC Designer, open the main menu, Settings, Integrations, Add API Key, and paste the key when connecting. It is sent in the `token` header to `www.webbsc.com`. The API allows 100 calls per hour per power user.

**Icon:** the app's own 180px `apple-touch-icon.png` from www.webbsc.com (no SVG or Simple Icons entry exists).

**Known gaps:** the spec has a few typos in its own paths (`/kpi/indicatos/...`, `wizzards`) that are kept as published. The document's binary download endpoints (Excel report, document download) return raw bytes.
