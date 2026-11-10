# Workiom

Covers the Workiom REST API for no-code workflow apps: listing apps and lists, reading list metadata (fields, views, filters), querying records with filters, sorting and paging, and creating, replacing and partially updating records. Seven hand-written tools; mutations require approval.

## Interface

Custom `fetch` tools over the ABP-style API at `https://api.workiom.com/api/services/app/...`, taken from Workiom's API guide (https://help.workiom.com/article/workiom-api-guide). Workiom documents a Swagger UI at `https://api.workiom.com/swagger/`, but it requires an authenticated session, so no OpenAPI document could be used. There is no official MCP server or GraphQL API.

## Auth

API key only. Create it in Workiom under Account Settings; it is sent in the `X-Api-Key` header. Workiom offers no user-created OAuth apps. The health check calls `Apps/GetAll`.

## Known gaps

- File upload (`POST /File/Upload`, multipart) is not exposed, so file fields cannot be attached.
- Records are keyed by field id; read `lists.get` first to find ids and data types.
- Workiom's guide shows a Bearer token on `UpdatePartial` but an API key everywhere else; `updatePartial` sends the API key like the other tools and is unverified against a live account.
- `lists.list` calls `Lists/GetAll`, which is not in the public guide (only seen in third-party references); unverified.
- `lists.get` sends `expand` as repeated `expand=` query parameters to match the documented array type; serialization is unverified.
- The guide is inconsistent on the User field shape (`{id, username}` vs `{id, label}` in its Create example); `records.create` documents `{id, username}`, unverified.
- Only the endpoints in the public guide are covered.
