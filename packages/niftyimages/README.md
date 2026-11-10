# NiftyImages

Manage NiftyImages, the dynamic and personalized image service for email campaigns: images, image types, countdown timers, maps and locations, fonts, and Data Stores with their records.

**Interface:** OpenAPI. The tools are generated from the vendor's official v2 document at https://dev.niftyimages.com/openapi/v1.json (API base `https://dev.niftyimages.com/v2`). Every mutation requires approval; read-only POSTs (image and record lookup, search, count, aggregate, validate) are treated as queries.

**Auth:** API key. Create a key in the NiftyImages app (app.niftyimages.com). Account-scoped keys reach all resources of the account; per the vendor's pricing page, account-level API access requires the Enterprise plan (full Data Stores and Maps need Business). Store keys (prefix `store-`) reach only one store and cannot create or delete stores, change schemas, or access other stores. The key is sent as `Authorization: Bearer`. The connection health check calls `GET /v2/whoami`. There is no OAuth.

**Icon:** the vendor's round logo from niftyimages.com (PNG).

**Gaps:** only the v2 REST API described by the vendor's OpenAPI document is covered. The vendor's hosted Store MCP (`/store_mcp`) only duplicates the Data Store endpoints already in the OpenAPI document, so it is not mounted.
