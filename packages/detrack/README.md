# Detrack

Delivery management with Detrack: jobs (deliveries and collections) with listing, search, create, update, delete, reattempt and PDF export of proof of delivery and shipping labels; depots; and route planning.

**Interface:** hand-written tools over the official Detrack API v2 (`https://app.detrack.com/api/v2`). Detrack documents the API only as an API Blueprint on Apiary (https://detrackapiv2.docs.apiary.io/, blueprint at https://jsapi.apiary.io/apis/detrackapiv2.apib); it publishes no OpenAPI document and no remote MCP server, so the 21 documented operations are wrapped directly under `jobs` (12), `depots` (6) and `routes` (3). Job and depot payloads are passed as free-form objects because a job has about 130 fields; each tool description lists the common ones. Every mutation requires approval. The `search` tool is a read-only POST.

**Auth:** API key. Create it in the Detrack dashboard under Integrations > API Key (https://help.detrack.com/en/articles/6553302-how-to-generate-your-api-key); sub-users can have their own key. It is sent in the `X-API-KEY` header. Detrack has no OAuth for customers.

**Icon:** Detrack's official app icon (512px, from the vendor's website favicon https://www.detrack.com/wp-content/uploads/2022/02/cropped-Favicon-512.png, which is served as WebP despite the .png name and was converted to PNG). It is not in Simple Icons and the vendor publishes no SVG of the mark.

**Known gaps:** the single-file download endpoints (`/dn/jobs/export/{do_number}`, binary PDF/TIFF) are not exposed; use `exportDocuments` and `exportStatus`, which return a download URL. The API is limited to 60 requests per minute. The health check lists one job. The older v1 API is deprecated and not covered.
