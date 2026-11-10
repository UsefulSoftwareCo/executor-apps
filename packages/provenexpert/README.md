# ProvenExpert

Covers the ProvenExpert API v1: rating summary and rich snippet, surveys, invitation links and invitation emails, seal/widget HTML, and (Enterprise plan) profiles, settings and SSO login links.

Interface: hand-written tools over the vendor's REST API, documented at https://developer.provenexpert.com/index_en.html (base URL `https://www.provenexpert.com/api/v1/`). ProvenExpert publishes no OpenAPI document, and every endpoint is a form-encoded POST. Structured `data` arguments are flattened to PHP-style form fields (`data[contact][city]`).

Auth: API ID and API key (`apiKey` method), sent as HTTP Basic (ID as username, key as password). Find both in your ProvenExpert account under the API section. There is no OAuth. Health check calls `rating/summary/get`.

Known gaps: which endpoints work depends on your plan (Free/Basic limited, Plus basic API, Premium adds rating, Enterprise everything). `auth/api/get` and `auth/api/children` are deliberately not exposed because they return API credentials. Every mutation requires approval. The `proxyUser` argument runs a call as another profile (Enterprise).
