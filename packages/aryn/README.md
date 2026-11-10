# Aryn

Aryn's document platform (DocSets, documents and their properties, async task results, property extraction and deletion jobs, natural-language query, plan and search) as tools.

**Interface:** OpenAPI. The official Aryn Platform spec, pinned to commit `88820f0` of aryn-ai/docs, `https://raw.githubusercontent.com/aryn-ai/docs/88820f021de3113b87bcd9c24eeeef278fda589c/api-reference/endpoint/platform/openapi.json` (the source of docs.aryn.ai's API reference), mounted against `https://api.aryn.ai`. The spec lists four servers (`api.aryn.cloud`, `api.aryn.ai`, `api.us.aryn.cloud`, `api.us.aryn.ai`), all labeled "US Region"; only `api.aryn.ai` is allowed, because the official Python SDK's `config.py` defaults the platform (storage/query) API to it. `api.aryn.cloud` is the DocParse host used for `/v1/document/partition`.

**Auth:** API key (bearer token). Create one in the Aryn console under API keys at https://app.aryn.ai. Aryn offers no OAuth.

**Known gaps:** The DocParse spec (`/v1/document/partition`, `/v1/async/submit/document/partition`) is not included: Aryn's published `docparse/openapi.json` is not valid JSON (a trailing comma in the `pipeline` enum), so it cannot be loaded. Async result, cancel and list endpoints are covered through the platform spec. Document upload and binary download endpoints use multipart or binary bodies and may be limited.
