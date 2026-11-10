# Modelry

Covers Modelry (CGTrader's 3D product visualization platform): products, 3D modeling requests (order, track, approve, reject, review issues), product assets, embeds (3D viewers) and file uploads, plus workspace listing. 23 tools.

**Interface:** hand-written tools over Modelry's REST API (`https://api.modelry.ai/api/v1`). Modelry publishes no OpenAPI document, only an apiDoc reference, hosted on a third-party CGTrader-branded domain (https://files.cgtarsenal.com/api/doc/index.html) and the only public reference found; its official status is unverified. The tools follow it. Mutations require approval.

**Auth:** API token. Create it at https://app.modelry.ai/settings. It is sent as the raw `Authorization` header value (no `Bearer` prefix). Modelry offers no OAuth.

**Known gaps:** Workspace create/delete and product repositories are not in Modelry's documented API, so they are omitted. The documented API gives no response schemas, so results are returned as raw JSON. `createBlob` registers a direct upload; the follow-up PUT to the returned storage URL is not covered, so use `uploadFile` (base64) for small files.


**Doc inconsistencies and choices:** `createEmbed` posts to `/v1/products/:product_id/embeds` (the doc header says `/v1/:product_id/embeds`, but its curl example and all sibling embed endpoints use `/products/`). `uploadFile` sends a flat body `{filename, base64_file, content_type}` as in the doc's request and curl examples (the parameter table nests them under `blob`; only the flat form is sent). `createReviewIssues` takes `severity` as a string and supports `issueImage` per the doc example; `reviewed` is sent as a JSON boolean (the documented type). The review issue `data` and `annotation` objects are not exposed.
