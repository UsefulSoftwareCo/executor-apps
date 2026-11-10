# Gitea

Repositories, issues, pull requests, organizations, teams, releases, Actions, packages, notifications and the admin API of Gitea, on gitea.com or any self-hosted instance.

**Interface:** OpenAPI. Gitea publishes an official Swagger 2.0 document at `/swagger.v1.json` on every instance; the package reads https://gitea.com/swagger.v1.json and sends calls to the instance URL stored on the account (`<instance>/api/v1`).

**Auth:** access token. Enter the instance URL (for example `https://gitea.com`, https only) and a token created under Settings > Applications > Generate New Token on that instance. It is sent as `Authorization: token <value>`. The instance URL may include a sub-path (`https://example.com/git`); query strings and fragments are rejected.

**Host pinning:** the provider declares no `hosts` (and so no `request` placements). Self-hosted domains are arbitrary and the framework only accepts static host lists, so the token cannot be pinned without dropping self-hosted support. The token reaches app code as a raw value; tool calls are restricted to the account's own instance origin (`allowedOrigin`). No per-account host allowlist is documented in the app-authoring reference; revisit if one is added.

**OAuth (known gap):** Gitea supports user-created OAuth2 apps (Settings > Applications; `/login/oauth/authorize`, `/login/oauth/access_token`, discovery at `/.well-known/openid-configuration`, client_secret_post), but the framework's `oauth2` config takes only static `discover`/`authorizationUrl`/`tokenUrl`, so it cannot target an arbitrary instance. Not offered until per-account discovery URLs are supported.

**Gaps:** the tool list comes from gitea.com's spec version; an older or newer self-hosted instance may lack or add operations. Endpoints needing admin rights fail unless the token's user is a site admin.
