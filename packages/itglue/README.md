# IT Glue

Tools for IT Glue (Kaseya) IT documentation: organizations, configurations, flexible assets, passwords, documents, contacts, locations, domains, checklists, and related resources. 199 tools; mutations require approval.

**Interface:** OpenAPI. IT Glue publishes only HTML API docs (https://api.itglue.com/developer/), no OpenAPI document. This package uses the community-maintained conversion of those official docs at https://github.com/jmaddington/ITG-Glue-OpenAPI (`itgapi.yaml`, regenerated daily). It is not an official IT Glue or Kaseya document, so recently added endpoints may lag.

**Auth:** API key only. IT Glue has no user-created OAuth apps. Create a key in IT Glue under Admin > Settings > API Keys (keys start with `ITG.`; API access needs an eligible plan). Enter the key and your data center: `us` (api.itglue.com), `eu` (api.eu.itglue.com) or `au` (api.au.itglue.com). The key is sent as the `x-api-key` header.

**Known gaps:** operation names are derived from paths because the converted spec has no operationIds. Responses are JSON:API documents.
