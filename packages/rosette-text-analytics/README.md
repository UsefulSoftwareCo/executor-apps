# Rosette Text Analytics

Multilingual text analytics with Rosette, now branded Analytics by Babel Street: language identification, sentences, tokens, morphology (lemmas, parts of speech, compound components, Han readings), syntax dependencies, entity extraction and linking, categories, sentiment, relationships, topics, events, semantic vectors and similar terms, transliteration, and the match endpoints (name similarity, name translation, name deduplication, address similarity, record similarity), plus `ping` and `info`.

**Interface:** hand-written tools over the documented REST API (`https://analytics.babelstreet.com/rest/v1`, docs at https://developer.babelstreet.com/). Babel Street publishes no public OpenAPI document (the spec URLs return 403) and no remote MCP server, so each endpoint is wrapped directly, with endpoint paths taken from the vendor's official Python client (https://github.com/rosette-api/python). Every analysis endpoint is a read-only computation (POST only to carry the body), so all tools are queries and need no approval.

**Auth:** API key. Sign up at https://developer.babelstreet.com/signup and create a key under API Credentials. It is sent in the `X-BabelStreetAPI-Key` header. Rosette has no OAuth.

**Icon:** the Babel Street mark, the vendor's own avatar for its `rosette-api` GitHub organization; Simple Icons has no entry.

**Known gaps:** document upload via multipart is not exposed (use `content` or `contentUri`). Nested options and free-form objects are passed through as JSON, so see the vendor docs for per-endpoint option names. The health check calls `/info`.
