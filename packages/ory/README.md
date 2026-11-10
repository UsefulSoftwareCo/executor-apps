# Ory

Manage an Ory Network project: identities, sessions, recovery and verification, courier messages, OAuth2 and OpenID Connect clients and tokens, Ory Permissions relationships and project configuration.

Interface: OpenAPI. Source: Ory's official "Ory APIs" document, https://raw.githubusercontent.com/ory/client-go/master/api/openapi.yaml (generated from ory/sdk). Each account's requests go to its own project origin, `https://<project-slug>.projects.oryapis.com`.

Auth:

- Project API key (`apiKey`): create one in the Ory Console under Project settings > API keys. Enter the project slug (shown in the console) and the key (`ory_pat_...`); it is sent as a bearer token.
- OAuth2 client credentials (`clientCredentials`): enter the project slug and the ID and secret of an OAuth2 client created in your project. A token is requested from `/oauth2/token` with the `client_credentials` grant. What it may do depends on the client's scopes and the project's configuration. Ory's admin APIs (identities, courier, relationships, project configuration and so on) authenticate with a project API key, not an OAuth2 client token, so most tools will be rejected for this method; use the `apiKey` method for them. Client credentials are only useful for OAuth2-protected resources. The account check only confirms a token can be minted.

Ory has no user-level OAuth sign-in for its admin APIs, so no `oauth2` method is offered.

Known gaps: operations of the Ory control plane (`https://api.console.ory.sh`, projects and workspaces, workspace API keys) are on a different origin and use a workspace key, so they are not exposed (34 operations). 38 operations in total are skipped for needing another auth scheme (workspace key, browser session token, basic auth). Self-hosted Ory and custom domains are not supported; the account's origin is derived from the project slug.
