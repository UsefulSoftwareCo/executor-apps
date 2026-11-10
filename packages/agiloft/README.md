# Agiloft

Agiloft contract lifecycle management and no-code business process platform: knowledgebase schema (tables, fields, saved searches), record search, read, create, update, upsert and delete, record locks, action buttons with async status, and attachment listing.

**Interface:** custom, hand-written tools over Agiloft's REST web services (`https://<instance>.agiloft.com/ewws/EW*`, documented at https://help.agiloft.com/space/HELP/43715778). Agiloft publishes no OpenAPI document, GraphQL API or MCP server; the API is a fixed set of operations (EWSearch, EWSelect, EWRead, EWCreate, EWUpdate, EWUpsert, EWDelete, EWLock, EWTable, EWSavedSearch, EWGetChoiceLineId, EWActionButton, EWAsyncStatus, EWAttachInfo) that work on any table, so 16 tools cover the whole data model. Table and field names are the logical names of the KB; use `schema.listTables` to discover them. Reads and searches are queries; every other tool requires approval.

**Auth:** KB login. Enter the instance hostname (for example `acme.agiloft.com`), the knowledgebase name, and the login and password of a native Agiloft user (LDAP accounts cannot use the REST API; the API needs an Advanced, Premium or Platform edition). Create a dedicated service user in Agiloft and give it only the permissions the agent should have, since every call runs as that user. The login and password are sent as the `$login` and `$password` parameters, as Agiloft's REST interface requires, to `*.agiloft.com` only.

OAuth 2.0 is not offered. Agiloft supports it (Setup > Integration > OAuth2 Client Setup creates a client bound to a service user, with redirect URIs you list and the scope `permissions_for:<contact id>`), but its authorization (`/ewws/oauth`) and token (`/ewws/otoken`) endpoints live on each customer's own host, and a provider declares static endpoints.

**Known gaps:**
- Instances on a customer-owned domain (on-premises or custom hostnames) are not reachable; only `*.agiloft.com` hosts are allowed.
- Attachment upload, download and removal (EWAttach, EWRetrieve, EWRemoveAttachment) are not covered; only `attachments.list` is.
- Agiloft's default answer format is JavaScript assignments; tools return those decoded into an object of field values. Search and read use Agiloft's JSON envelope (`success`, `message`, `result`) instead.
- Agiloft pauses about a second after each call (the WSDelay setting), so batch work is slow.
- The record encoding rules (choice text, linked-field `:` Query By Example, multi-value arrays) are Agiloft's own; see the tool descriptions.
