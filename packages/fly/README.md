# Fly

Manage Fly.io through its two official REST APIs. `machines`: apps, Machines (create, start, stop, exec, lease, metadata), volumes and snapshots, secrets and secret keys, certificates, IP assignments, deploy tokens, regions and Postgres clusters. `sprites`: Sprites (create, list, destroy), exec sessions, filesystem, checkpoints, services and logs, network/privileges/resource policy and OAuth connectors.

**Interface:** OpenAPI, two official documents mounted under their own keys:

- `machines` (100 tools): https://docs.fly.io/api/machines/openapi.json (server `https://api.machines.dev`)
- `sprites` (44 tools): https://api.sprites.dev/openapi.json (server `https://api.sprites.dev`)

Every mutation requires approval (65 in `machines`, 28 in `sprites`).

**Auth:** two API-token methods, both sent as `Authorization: Bearer <token>`. An account uses one method and gets the matching API only.

- `apiKey` ("API token") for `machines`. Create one with `fly tokens create org` / `fly tokens create deploy`, or in the Fly dashboard under Tokens. Paste the token as-is. Fly does not offer user-created OAuth apps for this API, so no OAuth is declared.
- `spritesToken` ("Sprites API token") for `sprites`. Create one at https://sprites.dev/account or with `sprite org auth` (format `org/token-id/secret`). Fly's docs describe these as Sprites tokens and never say a Fly API token is accepted by `api.sprites.dev`, so they are a separate method rather than assumed to be interchangeable.

Health checks: `GET /v1/tokens/current` on `api.machines.dev` (authenticated, so a bad token fails) and `GET /v1/sprites?max_results=1` on `api.sprites.dev`.

**Known gaps:** the GraphQL API (`api.fly.io/graphql`) is not covered; it is Fly's internal/legacy API and not documented as a public interface, and logs (NATS/log shipper) are not exposed over REST. The Sprites exec endpoint is also a WebSocket in practice, so command output streaming is limited over plain HTTP. Token scope limits what each tool can do. Tokens issued by `flyctl` with a `FlyV1 ` prefix have not been tested against a real account.
