# Hireflix

One-way video interview platform. This package covers the admin API at `/me`: positions, interviews and candidates, templates, themes, webhooks, API keys, usage, billing and company settings.

**Interface:** GraphQL, the primary Hireflix API, at `https://api.hireflix.com/me` (the schema is introspected when an account connects, so tools track the vendor's schema). Docs: https://hireflixsl.mintlify.app/ and the playground at https://api.hireflix.com/. Mutations require approval.

**Auth:** API key (`apiKey`), sent in the `x-api-key` header. Create one in Hireflix by clicking your name in the top-right, opening your profile and going to the API Keys section ([quickstart](https://hireflixsl.mintlify.app/tech/quickstart)). Hireflix offers no user-created OAuth apps, so there is no OAuth method.

**Known gaps:** The unauthenticated root endpoint (`https://api.hireflix.com/`, registration and plans) and the candidate-facing `/interview` endpoint are not mounted. Hireflix returns HTTP 200 even for errors; check the GraphQL `errors` payload. The icon is Hireflix's official 196px app icon (PNG), as no SVG mark is published.
