# Semantic Scholar

Search the Semantic Scholar academic literature graph: papers (relevance, bulk and title-match search, details, authors, citations, references), authors, paper recommendations, and the bulk dataset release and diff endpoints. All 20 operations are read-only lookups.

Interface: OpenAPI (Swagger 2.0), the three official documents from api.semanticscholar.org: `https://api.semanticscholar.org/graph/v1/swagger.json`, `.../recommendations/v1/swagger.json` and `.../datasets/v1/swagger.json`. They are mounted as `graph`, `recommendations` and `datasets` in one router. The documents declare no host and no security scheme, so `openapi.ts` supplies the base URLs and the `x-api-key` header; a few schema references containing spaces are inlined by patches so those operations are not skipped.

Auth: API key (`apiKey`). Request one at https://www.semanticscholar.org/product/api#api-key-form. The key is sent in the `x-api-key` header. The vendor's public endpoints also work without a key at a shared, heavily limited rate, and only the dataset download-link and diff endpoints strictly require one; however, Executor's account form requires a non-empty key to connect, so keyless calls are only possible outside Executor. There is no OAuth. The health check performs an autocomplete search because the API has no current-user endpoint.

Known gaps: the batch POST operations (author batch, paper batch, recommendations from positive/negative papers) only read, so they are treated as queries and need no approval. Dataset files are downloaded from the signed S3 URLs the API returns; those hosts are not called by the tools.
