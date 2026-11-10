# Accredible certificates

Issue and manage digital certificates and open badges with Accredible: credentials (create, bulk create, search, PDFs, blockchain data, analytics), evidence items, references, groups, designs, collections, departments, attribute keys, team members, skill frameworks, data exports and SSO links. 64 tools; all 44 mutations require approval.

Interface: Accredible's official OpenAPI 3.0 document, `https://raw.githubusercontent.com/accredible/api-documentation/master/openapi.json` (from the vendor's `accredible/api-documentation` repository). Requests go to the US production host `https://api.accredible.com`.

Auth: API key. Create it in the Accredible dashboard via your account name (top right) > Settings > General Settings > Manage API Keys > Add API Key at https://dashboard.accredible.com, choosing an Account-wide or Department-Specific key. It is sent as `Authorization: Token token=<key>`. Accredible does not offer user-created OAuth apps for this API.

Known gaps:
- The EU (`eu.api.accredible.com`) and sandbox (`sandbox.api.accredible.com`) hosts listed in the spec are not supported; only the US production host is.
- The icon is a hand-drawn SVG recreation of Accredible's mark (the official favicon), since the vendor publishes no SVG logo.

Spec pinning: the OpenAPI document (version 25.08.0) is pinned to commit 118808a8e01310e80d72910781396752e16aa421 of the vendor's own repository accredible/api-documentation, so upstream edits do not change the tools silently. Bump the SHA deliberately to pick up new operations.

Icon: Accredible publishes no official SVG logo (only raster PNG/WebP files), so the icon is a hand-drawn SVG redraw of the favicon mark and is an exception to the generated-icon rule.
