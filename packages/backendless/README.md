# Backendless

Backendless backend-as-a-service: data tables (query, count, save, update, upsert, delete, in bulk too), relations, users (register, login, role listing, password reset), file storage management, atomic counters, cache, hive management, pub/sub messaging, email and logging.

**Interface:** hand-written tools over Backendless's official REST API (docs: https://backendless.com/docs/rest/doc.html). Backendless publishes no OpenAPI document, no GraphQL API and no official remote MCP server. 54 tools; every mutation requires approval. Calls use the cluster's native endpoint, `https://<cluster host>/<application-id>/<rest-api-key>/...`, where the credentials are placed in the URL path. Because the REST key sits in the URL, any log of raw request URLs would expose it.

**Auth:** application ID plus REST API key. In the Backendless Console open Manage > App Settings and copy the Application ID and the REST API key (the key for the REST client type). Also enter the region of the cluster your app runs on: `us` (api.backendless.com), `eu` (eu-api.backendless.com) or `sa` (api.sa.backendless.com). Calls run with the permissions of the REST API client role, so table, file and user permissions in the Console still apply. Backendless has no OAuth.

**Known gaps:**
- Custom domains and `*.backendless.app` subdomains and Managed Backendless are not supported, only the three native clusters.
- Not wrapped: binary file upload and download, file append, Hive key/list/map/set operations, unit-of-work transactions, geo queries, push notifications, template emails, purchases, app management, and endpoints that need the CloudCode API key (enable/disable user, roles by user id, assigning and unassigning user roles, deleting a messaging channel).
- Operations that act as a logged-in user (user-token header) are not exposed.
