# Cloudsmith

Manage Cloudsmith artifact repositories: workspaces, repositories, packages, uploads, entitlement tokens, vulnerabilities, policies, teams, webhooks and more (377 tools).

Interface: Cloudsmith's official Swagger 2.0 document at https://api.cloudsmith.io/v1/swagger/?format=openapi (API at https://api.cloudsmith.io).

Auth: API key. Copy it from your Cloudsmith user settings (API Key page, https://cloudsmith.io/user/settings/api/). It is sent in the `X-Api-Key` header, as declared by the vendor Swagger document and confirmed by a live probe (a dummy key returns 401 "Invalid authentication credentials provided in X-Api-Key header"). Vendor help pages also show the form `Authorization: token <key>`; that is the same API key in a different header, and this package uses `X-Api-Key` to match the spec. The spec also declares HTTP basic, which is a password-based login and is not offered. The vendor docs we reviewed document only API keys; no user-created OAuth app flow was found.

Known gaps: one operation using the `auth_method` parameter is skipped. Mutations require approval. The integrations.sh record lists a "Cloudsmith MCP server" surface with unknown auth and no URL; we could not find a public endpoint, so it is not used.
