# Crunchbase

Search and retrieve Crunchbase company, people, funding and investor data: entity lookups (organizations, people, funding rounds, acquisitions, investments and more), searches, autocompletes and deleted entities.

Interface: OpenAPI 3.0, Crunchbase's own Enterprise API v4 document published by Crunchbase on SwaggerHub: https://api.swaggerhub.com/apis/Crunchbase/crunchbase-enterprise_api/1.0.3 (server `https://api.crunchbase.com/api/v4`).

Auth: API key only. Crunchbase offers no OAuth. Get a key from your Crunchbase account's integrations page (a Crunchbase Enterprise or API license is required); it is sent as the `X-cb-user-key` header.

Known gaps: the spec is dated 2021, so newer v4 endpoints and fields may be missing. The health check calls the autocompletes endpoint, which needs API access on the key. Search endpoints are POST requests but are read-only; they are marked as mutations and so ask for approval.
