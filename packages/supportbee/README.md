# SupportBee

SupportBee shared support inbox: tickets (list, search, create, archive, trash, spam, answered state), replies, internal comments, reply drafts, assignment to agents and teams, ticket labels and the audit trail, users and customer groups, teams, labels, snippets, forwarding addresses, filters (rules and consequences) and admin reports.

**Interface:** custom, hand-written tools over the SupportBee REST API (`https://<company>.supportbee.com`, docs at https://supportbee.com/docs/api/reference). SupportBee publishes an OpenAPI 3.0.3 document (50 operations, server `https://{company}.supportbee.com`), but only embedded in its Redoc HTML page with no standalone URL, so the 49 documented JSON operations are declared by hand from that document. Reads are queries; every mutation requires approval.

**Auth:** API token only. In SupportBee open your profile picture menu > API Token and copy the token. Enter the desk subdomain (the `acme` in `acme.supportbee.com`) and the token; it is sent as `Authorization: Bearer <token>` to `*.supportbee.com` only. SupportBee documents no OAuth flow. Reports require an admin token.

**Icon:** the line-art bee glyph extracted from the vendor's official SVG logo https://supportbee.com/static/images/wordmark.svg (the wordmark text is dropped; near-black is drawn white in the dark variant).

**Known gaps:**
- Attachment upload (`POST /attachments`, multipart) is not exposed, so replies, comments and tickets cannot carry new attachments; `attachment_ids` can only reference files uploaded elsewhere. The comment `attachments` shape is documented only as the response Attachment schema, so it is unverified.
- Create Ticket is the one endpoint SupportBee allows without auth; here it is always authenticated.
- Tools take JSON for list and object fields (`cc`, `bcc`, `team_ids`, `on_behalf_of`).
