# Plasmic

Plasmic's headless CMS: query and count entries of a content model, and create, update, publish and delete entries (six tools under `items`). Plasmic's visual builder, Codegen and Loader APIs are not exposed; they serve built pages to the Plasmic SDKs and are not a management API.

**Interface:** hand-written tools over the official CMS REST API, documented at https://docs.plasmic.app/learn/plasmic-cms-api-reference/ (base `https://data.plasmic.app/api/v1/cms`). Plasmic publishes no OpenAPI document and no remote MCP server for it. Routes: `GET /databases/{cmsId}/tables/{modelId}/query|count`, `POST .../rows`, `PUT /rows/{rowId}`, `POST /rows/{rowId}/publish`, `DELETE /rows/{rowId}`.

**Auth:** CMS tokens only; Plasmic has no OAuth for this API. Each account has three fields: `cmsId` (the CMS ID), `publicToken` and `secretToken`, all shown in the CMS's Settings tab in the Plasmic studio. Every request sends `x-plasmic-api-cms-tokens: <cmsId>:<token>` to `data.plasmic.app` only: the public token for published reads and counts, the secret token for draft reads and all writes. Add one account per CMS.

**Notes:** the health check makes no network call, because there is no account endpoint and every route needs a model id; a wrong ID or token is only detected on the first tool call. Mutations require approval.

**Icon:** the Plasmic rainbow mark from the official brand asset https://static1.plasmic.app/brand/2023/logo-cropped.png (368x184 PNG; no SVG published).
