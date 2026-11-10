# Stackby

Work with Stackby, the spreadsheet-database tool: list, create, update and delete rows, browse views, and manage stacks, tables and columns.

**Interface:** hand-written tools over Stackby's documented v1 REST API (`https://stackby.com/api/v1/...`). The source is Stackby's Postman documentation (https://documenter.getpostman.com/view/7317658/2sAYkGLz1i); paths, methods and bodies were reconciled against its raw collection JSON (`documenter.gw.postman.com/api/collections/7317658/2sAYkGLz1i`). It is not an official OpenAPI spec: Stackby publishes no OpenAPI document and no MCP server, so the endpoints are wrapped directly: `listRows`, `newRowsInView`, `listViews`, `createRows`, `updateRows`, `deleteRows`, `listStacks`, `createStack`, `deleteStack`, `listTables`, `createTable`, `deleteTable`, `listColumns`, `createColumn`, `deleteColumn`. Every mutation requires approval.

**Auth:** API key, sent in both the `x-api-key` header (named in the vendor's authentication text) and the `api-key` header (used by every request in the vendor's Postman collection), so either server behaviour works; both go only to stackby.com. Create it in Stackby under Account settings (https://www.stackby.com/account). Stackby has no OAuth.

**Icon:** Stackby's official 180px logo PNG from stackby.com (the vendor publishes no SVG).

**Known gaps:** file upload (`POST /v1/uploads`, multipart) is not exposed. **Health check exception:** Stackby has no current-user or account endpoint; every read needs a stack or workspace ID, so the provider deliberately declares no `health` check. Row, create, update and delete calls are capped at 10 records, and the API allows 5 requests per second per stack. The older betav1 and v0 endpoints are deprecated and not used.
