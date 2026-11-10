# Bika.ai

Bika.ai is an AI automation database platform. This package covers spaces, nodes, database records (v2 list/get/create/update/delete), fields, views, members, teams, roles, automation triggers and run cancellation, embed links, attachments, outgoing webhooks and the current user.

Interface: Bika.ai's official OpenAPI document, https://bika.ai/api/openapi/bika/openapi.json (docs: https://bika.ai/help/guide/developer/openapi). The published document uses `:param` path templates, a relative server URL and declares no security scheme, so `openapi.ts` embeds a copy rewritten to `{param}` paths, the absolute server `https://bika.ai/api/openapi/bika` and bearer auth. Operations the document marks deprecated (the v1 record endpoints, superseded by v2) are dropped. Path parameters missing from the published document (`spaceId` on get space, `runId` on cancel run) are declared in the copy. Some operation summaries in the vendor document are inaccurate (for example `PUT /roles/{roleId}` is labelled "Create Role").

Auth: API token sent as `Authorization: Bearer <token>`. Per the vendor guide the token comes from your user settings in Bika.ai. The guide does not say whether a token is limited to one space; that is not documented, so do not assume it. Bika.ai offers no user-created OAuth apps.

Known gaps: the document has no response schemas for some operations (a few are typed as bare strings); the AITable-compatible API (https://bika.ai/help/openapi/apitable) is not included. Whether Bika publishes an official remote MCP server was not verified.
