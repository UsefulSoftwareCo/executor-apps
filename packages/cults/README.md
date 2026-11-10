# Cults

Cults (cults3d.com) is a marketplace for 3D printing models. This package exposes Cults' GraphQL API (creations, creators, categories, your account and sales, and the mutations Cults offers) as tools.

Interface: GraphQL, `POST https://cults3d.com/graphql`, ([docs](https://cults3d.com/en/pages/graphql), which return 403 to automated fetches).

Auth: API key only. Cults uses HTTP Basic auth with your Cults nickname as the username and an API key as the password. Create a key at https://cults3d.com/en/api/keys (a read-only key works for queries). Cults has no OAuth for third-party apps. Model files are never served by the API.

Known gaps: the icon is the Cults mark taken from a logo-aggregator PNG (seeklogo.com) because cults3d.com blocks automated downloads and publishes no brand kit. Health check queries `myself { __typename }`. Unauthenticated introspection is rejected (`HTTP Basic: Access denied`), so the tool list is generated from the live schema at runtime using your credentials and was not enumerated at authoring time. Auth and `myself` were cross-checked against third-party clients (Metorial's Cults spec, Kiln, destl), not the vendor page itself.
