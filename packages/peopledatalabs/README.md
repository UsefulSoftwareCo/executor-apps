# People Data Labs

Person and company data enrichment: person enrich, identify, search and retrieve (retrieve by person ID in bulk), company enrich and search, company/school/location cleaners, autocomplete, IP enrichment, job title enrichment and skill enrichment.

**Interface:** OpenAPI. People Data Labs' official specification, published by the vendor at https://github.com/peopledatalabs/openAPI-specifications (`pdl-specs.json`), served from `https://api.peopledatalabs.com`. It compiles to 21 tools (8 mutations, which require approval).

**Auth:** API key only. People Data Labs does not offer OAuth. Create a key in the dashboard at https://dashboard.peopledatalabs.com/ (API Keys). The key is sent in the `X-API-Key` header. The health check calls the free autocomplete endpoint, so connecting does not spend credits.

**Known gaps:** the spec omits the vendor's bulk person enrichment (`POST /v5/person/bulk`, 1-100 records), job posting search, company bulk enrich and person changelog, so these tools are unavailable. The spec's `POST /v5/person/retrieve/bulk` (retrieve by person ID) has not been verified live. most enrichment, search and identify calls consume credits on your PDL plan. The vendor spec was last updated in 2024, so newer endpoints are not included. The POST search and cleaner operations are read-only but are classified as mutations by the spec's HTTP method and therefore ask for approval.
