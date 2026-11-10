# GLEIF

Look up Legal Entity Identifier (LEI) data from the Global Legal Entity Identifier Foundation: LEI records (search by name, country, ISIN, registration authority, status, category), Level 2 ownership relationships (direct and ultimate parents and children, relationship records, reporting exceptions), LEI issuers, vLEI issuers, registration agents, reference data (countries, regions, legal forms, registration authorities), field metadata and name type-ahead.

## Interface

Hand-written read-only tools (`fetch`) over the official GLEIF API v1, `https://api.gleif.org/api/v1`, documented at https://documenter.getpostman.com/view/7679680/SVYrrxuU and https://www.gleif.org/en/lei-data/gleif-api. GLEIF publishes no OpenAPI document (only a JSON:API `fields` endpoint), so there is nothing to compile. 33 tools. The vendor pages (the gleif.org API page) describe the API in prose only and the Postman documenter returned no endpoint content, so every endpoint path was verified against live responses from the public API (200, or the expected 404 for missing parent/exception records).

## Auth

None. The API is free and public; the app declares no account. No rate limit is documented in the vendor sources read; requests are unauthenticated.

## Known gaps

- Only GET endpoints exist; the API is read-only.
- `directParentException` and `ultimateParentException` return 404 when the entity has no reporting exception; parent tools return 404 when no parent is reported.
- The `fuzzycompletions` endpoint returned no results when probed, so type-ahead uses `autocompletions` (fulltext).
- Bulk golden-copy downloads are not covered.
