# PDF Blocks

Process PDF documents with PDF Blocks: merge; split by page count, at a page, by size or into page groups; reorder, extract, remove, reverse and rotate pages; add or remove passwords, restrictions and signatures; add text or image watermarks. 17 tools, all mutations (each asks for approval).

**Interface:** OpenAPI. PDF Blocks does not publish its OpenAPI document (its [docs](https://www.pdfblocks.com/docs/api/openapi-specification) say to request it by email), and the only public copy (APIs.guru, spec 1.5.0) is out of date: it lacks the split and reorder actions, uses old watermark paths (`/v1/add_watermark/text`) and old page parameters (`first_page`/`last_page`). So `openapi.ts` holds a hand-written OpenAPI document built from the vendor's current reference (API 1.18.0, https://www.pdfblocks.com/docs/api/actions-overview), one operation per documented action, using the current paths such as `/v1/add_text_watermark`. Split actions request `Accept: application/json` and return the parts as base64 PDFs. Request and response handling of multipart uploads and binary PDFs was compiled and deployed but not exercised against the live API (no credentialed calls were made). If the vendor later publishes its spec, replace the document with it.

**Auth:** API key, sent as `X-API-Key`. Create one in the [PDF Blocks dashboard](https://accounts.pdfblocks.com) (a free key is available at https://www.pdfblocks.com/try-free). The vendor offers no OAuth.

**Regions:** only the global host `api.pdfblocks.com` is mounted. The vendor also offers regional hosts that pin processing to a jurisdiction: `us.`, `hipaa.`, `eu.`, `uk.`, `ca.`, `au.`, `jp.`, `in.` and `br.` under `api.pdfblocks.com`. Which regions a key can reach depends on the plan (Free: global; Starter: global, US, EU; Business: all). A key for a regional or data-residency account cannot be used with this package, which only sends credentials to the global host.

**Known gaps:** no health check, because all 17 actions are POST requests that process a file and the API has no read-only endpoint; regional hosts are not mounted.
