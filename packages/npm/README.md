# npm

Search and inspect packages on the npm registry, manage dist-tags, package access, organizations and teams, read download counts, and check dependencies against security advisories.

**Interface:** hand-written tools over the documented npm registry API (`https://registry.npmjs.org`, reference at https://github.com/npm/registry/tree/main/docs) and the public downloads API (`https://api.npmjs.org/downloads`, https://github.com/npm/registry/blob/main/docs/download-counts.md). npm documents no OpenAPI document or remote MCP server (the integrations.sh record lists only the registry HTTP API and the CLI; no vendor page announcing either was found). 29 tools: `whoami`, `packages.*` (search, get, abbreviated, getVersion), `distTags.*`, `access.*`, `orgs.*` (members, teams, team access), `downloads.*` (point, range, versions) and `audit`. Every mutation requires approval. The downloads API is unauthenticated, so the token is only sent to the registry.

**Auth:** access token (`apiKey`). Create one at https://www.npmjs.com/settings/~/tokens (granular access token, or classic Automation token). Sent as a Bearer header. Pick read permissions for read-only use; organization, team and dist-tag tools need read-write permissions on the relevant packages or organization. npm has no user-created OAuth apps.

**Icon:** the npm mark from Simple Icons.

**Known gaps:** publishing and unpublishing packages, deprecating versions, and managing tokens are not exposed (publishing needs a tarball upload; token management requires a session login that access tokens cannot do). Some organization endpoints are undocumented in the public reference and behave as the npm CLI uses them. Tokens with two-factor writes enabled on the account may be refused on mutations. The package id is `npm`.
