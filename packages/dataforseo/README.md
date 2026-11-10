# DataForSEO

SEO and marketing data from DataForSEO: SERP results, keywords data, DataForSEO Labs, backlinks, on-page audits, domain analytics, content analysis, merchant, business data, AI optimization and the account appendix.

Interface: OpenAPI, from DataForSEO's official full specification at https://raw.githubusercontent.com/dataforseo/OpenApiDocumentation/master/openapi_specification.yaml (565 tools). Every POST (queries that create tasks or run live, billed requests) is a mutation and asks for approval; GET result retrieval does not.

Auth: API login and password (HTTP Basic). Find them at https://app.dataforseo.com/api-access; the API password is generated there and differs from the account password. DataForSEO offers no OAuth.

Known gaps: the sandbox host (sandbox.dataforseo.com) is not used; only api.dataforseo.com is reachable. The icon is the official 512px app icon from dataforseo.com (no SVG is published).
