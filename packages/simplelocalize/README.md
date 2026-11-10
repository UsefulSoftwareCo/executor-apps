# SimpleLocalize

Manage SimpleLocalize translation projects: translation keys, translations, languages, tags, customers, glossary, comments, imports, exports, environments and publishing, jobs, auto-translation, and (with a personal token) projects and contributors.

Interface: OpenAPI 3.1, the vendor's official document at https://api.simplelocalize.io/openapi/docs (58 tools, no skipped operations). Mutations require approval.

## Auth

- Project API key (`apiKey`): sent as `X-SimpleLocalize-Token`. Covers most operations. Find it in the project under Settings > Credentials > API Key.
- Personal access token (`personalToken`): sent as `Authorization`. Needed for the Projects API (list/create projects, contributors). Create one at https://simplelocalize.io/dashboard/security/ (up to 5 per user).

SimpleLocalize offers no OAuth.

## Gaps

Each tool only works with the credential type its operation declares; a project key cannot call the personal-token operations and vice versa.
