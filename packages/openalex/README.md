# OpenAlex

Search and analyze the OpenAlex open scholarly catalog: works, authors, sources, institutions, topics, subfields, fields, domains, keywords, publishers, funders, awards, countries, languages, licenses and more, plus autocomplete, rate-limit status and changefiles. All 44 operations are read-only.

**Interface:** OpenAPI, generated live from OpenAlex's own document at https://help.openalex.org/openapi.json (formerly developers.openalex.org). API host: `api.openalex.org`.

**Auth:** API key (`apiKey`). Create a free key at https://openalex.org/settings/api (sign in or make an account). The spec declares it as the `api_key` query parameter, but the package overrides the scheme to send the key as an `Authorization: Bearer` header (which OpenAlex accepts identically), so it never appears in request URLs. OpenAlex has no OAuth for API access.

**Known gaps:** The write and curation endpoints (author curation, collections, alerts) and the OQL API are not in the published OpenAPI document, so they are not exposed.
