# Agile CRM

Manage Agile CRM contacts and companies, deals and tracks, notes, tasks, events, campaigns, documents and help desk tickets (about 63 tools).

## Interface

Hand-written tools over the Agile CRM REST API, `https://<domain>.agilecrm.com/dev/api`. Agile CRM publishes no OpenAPI document, MCP server or GraphQL API; the endpoints and bodies follow the official reference at https://github.com/agilecrm/rest-api. Every mutation requires approval. Request bodies for create and update calls are passed through as Agile CRM JSON, as shown in each tool's description.

## Auth

API key only (Agile CRM has no OAuth for user-created apps). Connect with:

- Domain: the part before `.agilecrm.com` in your account URL.
- Email: the email of the Agile CRM user who owns the key.
- REST API key: Admin Settings > API & Analytics > API Key, the first one ("API Key for REST client").

Requests use HTTP Basic auth (email as username, key as password) and are sent only to `*.agilecrm.com`.

## Known gaps

- Company create, update, read and delete go through the contact tools with `"type": "COMPANY"`; only listing has a dedicated tool.
- The API documents no "current user" endpoint, so the connection health check lists one contact.
- `deals.bulkDelete` sends `ids` as a form-encoded field holding a JSON array string. The vendor reference shows a JSON-looking body under `application/x-www-form-urlencoded`, which is self-contradictory; form encoding was kept as the documented content type.
- Email, bulk-tag and file-upload endpoints beyond those listed in the reference are not covered.
