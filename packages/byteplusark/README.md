# BytePlus Ark

BytePlus ModelArk (Ark) is BytePlus's generative AI platform. This package covers the asynchronous video generation task API (create, get, list, cancel or delete) for Seedance models, plus the OpenAI-compatible data-plane endpoints for chat completions, image generation (Seedream) and embeddings.

**Interface:** custom tools written with `fetch` against the official API at `https://ark.ap-southeast.bytepluses.com/api/v3`. BytePlus publishes no OpenAPI document or MCP server for ModelArk, so the tools follow the documentation at https://docs.byteplus.com/en/docs/ModelArk/Video_Generation_API (the docs pages render client-side; field names were cross-checked against the OpenAI-compatible surface). Tools: `video.create`, `video.get`, `video.list`, `video.cancelOrDelete`, `chat`, `images`, `embeddings`. Every mutation (including the billable generation calls) requires approval. Chat takes non-streaming requests only; less common request fields go in `extra`.

**Auth:** API key, sent as `Authorization: Bearer <key>`. Create one in the BytePlus console under ModelArk, API key management. BytePlus Ark has no user-created OAuth apps. The health check lists one video task (read-only) and treats only 401/403 as a bad key.

**Known gaps:** only the `ap-southeast` endpoint is configured; accounts in other regions would need a different host. Control-plane operations (endpoints, model activation, API key management) use the signed BytePlus OpenAPI with access keys and are not included. Model ids and inference endpoint ids are account and region specific; the package does not list them.
