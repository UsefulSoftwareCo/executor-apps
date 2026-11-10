# Stability AI (DreamStudio API)

Covers the Stability AI developer platform API, the API behind DreamStudio. The package id stays `dreamstudio` because that is the catalog target, but the product is Stability AI's platform: Stable Image generation (Ultra, Core, SD3), upscaling (conservative, creative, fast), editing (erase, inpaint, outpaint, search and replace/recolor, remove background, relight), control (sketch, structure, style, style transfer), Stable Audio 2/2.5 and Stable Fast 3D / Point Aware 3D, plus the result-polling endpoints.

Interface: OpenAPI, Stability's official document at https://api.stability.ai/v2alpha/openapi (linked from https://platform.stability.ai/docs/api-reference). Despite the URL, the document at `/v2alpha/openapi` is the v2beta spec (its `info.title` is "StabilityAI REST API v2beta"); `/v2beta/openapi` returns 404, so the v2alpha URL is the only stable location. Some of its paths are under `/v2alpha/` and some under `/v2beta/`. 31 operations (27 POST, 4 GET), none skipped.

Auth: API key. Create one at https://platform.stability.ai/account/keys and paste it as the account secret. It is sent as `Authorization: Bearer <key>` to `api.stability.ai`. Stability offers no OAuth. The health check calls `GET /v1/user/account`.

Known gaps: the v1 REST API (engines, `/v1/user/balance`, `/v1/user/account`) is not in the published document and is not exposed as tools (account is used only by the health check). Many endpoints take multipart uploads and return binary images or audio; large outputs may be impractical to read through tool results. Generation calls spend credits, so all POSTs require approval.

Icon: Stability AI's own platform mark (https://platform.stability.ai/small-logo-purple.svg). DreamStudio has no separate mark, and the product here is the Stability AI platform, so the icon is the product's own.
