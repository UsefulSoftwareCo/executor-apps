# Docupilot

Document automation with Docupilot: templates, folders, content blocks, document generation, merges, deliveries, team and workspace administration.

**Interface:** OpenAPI, Docupilot's official V2 document at https://api.docupilot.app/api/v2/schema/ (120 operations, 68 mutations gated by approval). Requests go to the US server `https://api-us1.docupilot.app`, the only server the document declares. Accounts on other regions are not covered.

**Auth:** API key only (Docupilot has no user-created OAuth apps). In Docupilot open Settings > API Settings and create a key; copy the key and secret (the secret is shown once). Enter the base64 of `key:secret` as the credential, for example `echo -n KEY:SECRET | base64`. It is sent as `Authorization: Bearer <value>`, as in Docupilot's API overview (https://help.docupilot.app/developers/api-overview). The schema itself says the prefix is "Basic"; the help docs say Bearer, and this package follows the docs. API access requires a Starter plan or above.

**Workspace:** workspace-scoped operations take an `X-Workspace` parameter holding the workspace ID (Settings > Workspace details).

**Known gaps:** only the US region; the Bearer vs Basic prefix could not be verified without a real account.
