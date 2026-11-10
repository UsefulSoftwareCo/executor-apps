# TheCatAPI

Covers TheCatAPI (thecatapi.com, the "Cats" toolkit): breeds, breed groups and colours, random and searchable cat images, image upload and labels, facts, health tips, favourites, votes, categories, sub-ids, pets (profiles, visits, observations, portraits, scores), calculators, account quota and webhooks.

Interface: OpenAPI 3, published by the vendor at https://api.thecatapi.com/openapi-json (linked from https://docs.thecatapi.com). Requests go to https://api.thecatapi.com/v1, the base URL the vendor's docs give (the spec's `servers` entry says beta-api.thecatapi.com/v1; both hosts serve the API, and the package overrides the spec with `baseUrl`). 70 tools, 27 of them mutations (all require approval).

Auth: API key only (sent as the `x-api-key` header). Create one at https://thecatapi.com (sign up, then the dashboard). No OAuth is documented by the vendor.

Known gaps: the free plan is rate limited to 10 requests per minute; some operations (pets, health tips, calculators) may require a paid plan; image upload takes the vendor's multipart form. The health check calls `/accounts/quota`.
