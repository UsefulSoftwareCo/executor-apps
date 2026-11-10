# Penpot

Covers the Penpot design platform: teams, projects, files, pages, comments, libraries, fonts, share links, access tokens and exports.

**Interface:** Penpot's own OpenAPI description, published at https://design.penpot.app/api/main/doc/openapi.json (149 RPC methods, all `POST` under `/api/main/methods`). The published document omits leading slashes on paths, has null descriptions and declares no security scheme, so `spec.json` is a vendored copy normalized for those points (examples stripped). Every call is a POST, so the 53 read-only `get-*`, `search-*`, `check-*` and `all-*` paths, plus `exportBinfile` and `hasFileLibraries` (marked read-only by hand), are marked as queries in `openapi.ts`; the rest need approval. The methods that return secrets (`getAccessTokens`, `getCurrentMcpToken`, `getTeamInvitationToken`) are explicitly marked as mutations so they need approval too. `getTeamInvitations` (email, role, expired) and `checkTeamExternalInvitations` (booleans) return no tokens per the Penpot backend source, so they stay queries.

**Auth:** access token (`apiKey`). In Penpot open Your account > Access tokens, create a token and paste it. It is sent as `Authorization: Token <token>`. OAuth apps for third parties are not documented in Penpot's access-token guide and this was not verified, so only the token method is offered. The health check decodes `email` from `get-profile`, because Penpot returns an anonymous profile (no email) with HTTP 200 for missing or invalid tokens.

**Known gaps:** only Penpot cloud (`design.penpot.app`) is wired up; self-hosted instances would need a different host. Auth flows that need a password (login, register) are present in the spec but not useful with a token.
