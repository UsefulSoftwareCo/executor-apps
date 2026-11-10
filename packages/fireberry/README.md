# Fireberry

Fireberry CRM (formerly Powerlink): read and write records of any standard or custom object (accounts, contacts, opportunities, tasks, invoices, ...), run v3 and legacy queries, batch create/update/delete records, and discover objects, fields and picklist values.

**Interface.** Hand-written tools (18) over Fireberry's REST API at `https://api.fireberry.com`, documented at https://developers.fireberry.com/llms.txt. Fireberry publishes per-endpoint OpenAPI fragments but no single document, and its official MCP server (`@fireberry/mcp-server`) is a local stdio package, not a remote server, so neither could be mounted. The record tools take the object as a parameter, which covers every object including custom ones, instead of one tool per object.

**Auth.** API access token only (sent in the `tokenid` header for `/api/*` and as the `tokenid` query parameter for `/metadata/*`, as the vendor documents). Create it in Fireberry under Profile picture > Profile > Account Security > API Access Token (see https://developers.fireberry.com/docs/authentication). The token acts as that user, so it sees only what the user is permitted to see. Fireberry offers no user-created OAuth apps.

**Gaps.** File upload (multipart) and custom-field creation are not exposed; custom-object creation and custom-field deletion are. Batch APIs are not available on every Fireberry license.


**Batch limits.** Fireberry documents a 20-record maximum only for batch delete; the batch create and update pages state no maximum, so the tool descriptions recommend 20 or fewer. The vendor does not document batch response shapes (create/update/delete); tools return the raw JSON.

**Source provenance.** No Fireberry entry exists in integrations.sh. The vendor docs are the authority.
