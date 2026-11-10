# Maximizer

Maximizer CRM (Cloud and On-Premise 2024R1 or later): contacts and companies (address book entries), leads, opportunities, tasks, notes, appointments, cases, campaigns, documents and interaction logs, plus read access to users, teams, territories and field definitions.

**Interface:** hand-written tools over Maximizer's Octopus API, `https://api.maximizer.com/octopus/{Read,Create,Update,Delete}` (docs: https://developer.maximizer.com/reference/octopus-api). Maximizer publishes no OpenAPI document, only a Postman collection and prose docs, so there are 11 writable objects with read/create/update/delete tools, 9 read-only objects, a `fieldOptions` lookup and a generic `request` tool for anything else (55 tools). Mutations require approval. The official remote MCP server (`https://mcp.maximizer.com/mcp`) is not used: it only admits assistants Maximizer has approved (currently Claude) and needs the tenant to enable it.

**Auth:** personal access token. In Maximizer, open the profile menu, choose Personal Access Tokens, Add Token, pick an expiry and copy the token (shown once). It carries the creating user's rights; for read-only access make a read-only service user and create the token for it. OAuth is not offered: Maximizer's authorization-code flow needs client registration by email to devops@maximizer.com and requires the PKCE method `SHA256` instead of the standard `S256`.

**Known gaps:** Cloud only (`api.maximizer.com`); On-Premise hosts differ per installation and are not supported. Webhooks, Workflow objects beyond reads, batch queries and schema calls are reachable only through `request`. The health check reads one User record and assumes a JSON response. Not exercised against a real account.

Icon: Maximizer's published app icon (512px PNG from maximizer.com); one variant is used for both themes because the dark teal tile must not be inverted.
