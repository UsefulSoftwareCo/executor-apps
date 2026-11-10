# Heap

Server-side Heap product analytics: track custom events (single and bulk), identify users, set user and account properties, and delete users (with deletion status). Nine hand-written tools.

**Interface:** Heap publishes no downloadable OpenAPI file, so the tools call the documented REST endpoints on `https://heapanalytics.com` (and `https://c.eu.heap-api.com` for EU workspaces) directly. Source: https://developers.heap.io/reference/server-side-apis-overview and https://developers.heap.io/reference/user-deletion.

**Auth:** Heap has no OAuth. Two API-key methods, one per data center (`apiKey` for US, `euApiKey` for EU). Both take the App ID and API key from Heap under Account > Manage > Privacy & Security > API (the app ID is your Main Production environment ID). The ingestion endpoints only use the app ID; the API key is exchanged for a temporary token (`/api/public/v0/auth_token`, HTTP Basic) for user deletion, and for the connection health check. User deletion always goes to heapanalytics.com, which Heap documents for both data centers.

**Gaps:** Heap offers no public read or query API (reports and data live in Heap Connect and the warehouse), so this app only writes data. The client-side APIs are not included. Every tool is a mutation and requires approval, except `deletionStatus`.
