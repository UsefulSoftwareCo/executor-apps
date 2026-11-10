# CodeREADr

Covers the CodeREADr barcode scanning API: services, validation databases and their values, scans and scan properties, scan uploads, users, devices, questions and answer options, and API limits (39 tools).

**Interface:** custom, hand-written tools with `fetch`. CodeREADr publishes no OpenAPI document, GraphQL API or MCP server. Every call is a form POST to `https://api.codereadr.com/api/` with `section`, `action` and `api_key`, documented at https://developer.codereadr.com/1.0/api/overview/. Responses are XML only; the package parses them into a `{ name, attributes, text, children }` tree and turns `<status>0</status>` into an error carrying the vendor's error code and message (https://developer.codereadr.com/1.0/reference/error-codes/). The parser has tests: `node --test packages/codereadr/xml.test.ts`.

**Auth:** API key. Generate it on the API Keys page of Account Settings (https://secure.codereadr.com/account/api/key). It is sent as the `api_key` form field. The API is available on paid plans only. CodeREADr offers no OAuth. Health checks call the read-only `limits` endpoint.

**Known gaps:** the CSV upload action for databases (`section=databases&action=upload`, a multipart `csvfile` upload) is not exposed; the Barcode Generator API (`barcode.codereadr.com`) returns images and is not exposed; the Custom Questions and Postback pages describe endpoints you host, not API calls. Mutations require approval. Deployment was verified against the local Executor; no real account was connected, so response shapes follow the vendor's documentation.
