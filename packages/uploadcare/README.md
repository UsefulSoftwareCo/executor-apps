# Uploadcare

Manage Uploadcare files (list, info, store, delete, copy to local or remote storage), file groups, file metadata, webhooks, document and video conversions, add-ons, and project info.

Interface: OpenAPI. The source is Uploadcare's official REST API 0.7 OpenAPI 3.1 document: https://uploadcare.com/docs/openapi/rest-api.json (37 tools). It is not a community conversion.

Accept header: every operation in the spec declares a required `accept` header, so every tool takes `headers.accept`. Callers must pass `application/vnd.uploadcare-v0.7+json`; the index instructions say so. Without it the API falls back to an older default version.

Auth: API key only. Uploadcare REST has no OAuth. Create keys in the Uploadcare dashboard under the project's API keys page. Enter the credential as `PUBLIC_KEY:SECRET_KEY` (public key, a colon, then the secret key); it is sent as `Authorization: Uploadcare.Simple <public>:<secret>`. Limitation: the spec describes the Simple scheme as for quick tests; production use is the signed `Uploadcare` scheme, which needs a per-request signature computed by a backend. That scheme is not supported here.

Known gaps: the Upload API (`upload.uploadcare.com`, public-key based uploads, published as upload-api.json) and the URL API are not included; adding the Upload API would need that host in `hosts` and a different auth. The signed auth scheme is also unsupported.
