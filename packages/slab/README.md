# Slab

Read and write Slab knowledge-base content: posts, topics, comments, users and search.

Interface: Slab's GraphQL API at `https://api.slab.com/v1/graphql` (schema published at
https://studio.apollographql.com/public/Slab/home). Tools are generated from the schema by introspection
at connect time; every mutation requires approval.

Auth: API token. A Business or Enterprise workspace admin copies it from Team settings, Developer
(https://help.slab.com/en/articles/6545629-developer-api). It is sent as the bare `Authorization` header.
Slab has no user-created OAuth apps. Results depend on what the Slab Bot user can access.

Gaps: the token is workspace-wide and Business/Enterprise only. The schema could not be introspected without a
real token during authoring, so the health check is the schema-independent `{ __typename }`; no account name is shown. The tool count and surface are unverified until a real token is used (same as Linear). No official Slab MCP server was found, but this was not ruled out conclusively.
