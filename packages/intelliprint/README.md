# Intelliprint

Hybrid mail: create and manage print jobs (letters and postcards printed and posted via Royal Mail), letterhead backgrounds, mailing lists and their recipients.

**Interface:** OpenAPI 3.1, Intelliprint's official document at https://www.intelliprint.net/openapi.json (server `https://api.intelliprint.net/v1`). It does not include the templates listing or PDF merge tool; those are not covered.

**Auth:** API key (bearer). Create one at https://account.intelliprint.net/api_keys. Pass `testmode: true` on a print job to avoid printing and being charged. The vendor developers page says you may generate separate keys per environment (test/live) for isolation. Keys are sent as `Authorization: Bearer <key>` (the documented form; bare-key samples in older vendor docs are not used). Intelliprint offers no user-created OAuth apps, so there is no OAuth method.

Every mutation requires approval, including creating or confirming print jobs (which post real mail and cost money).

**Known gaps:** templates and merge-files endpoints are not in the published spec. The vendor's API reference describes an optional `Account` header to select a workspace on team accounts; it is not in the spec and this package does not send it, so all calls (and the health check) target the default workspace.
