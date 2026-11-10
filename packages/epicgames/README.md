# Epic Games

Browse public Fortnite islands and read their engagement metrics (plays, unique players, minutes played, average minutes per player, peak CCU, favorites, recommendations, retention), island and genre rankings, and platform-wide peak CCU, through Epic's Fortnite Data API.

Interface: Epic's official OpenAPI 3.1 document for the Fortnite Data API, `https://api.fortnite.com/ecosystem/v1/docs/openapi.yaml` (18 read-only tools). Docs: https://api.fortnite.com/ecosystem/v1/docs/

Auth: none. The Fortnite Data API is public and takes no credentials, so the app declares no account and there is nothing to connect. The spec defines an unused `clientCredentials` scheme (token URL `https://api.epicgames.dev/epic/oauth/v1/token`) that no operation references. Epic's user OAuth (Epic Account Services at `https://www.epicgames.com/id/authorize`) is not used: the Data API does not accept or need it.

Known gaps: only public, discoverable islands; history is limited to 7 days; islands with fewer than 5 unique players return null values. Unreal Engine Remote Control tools (`/remote/...`) are not included: they talk to a local Unreal Editor at `127.0.0.1:30010`, which a hosted Executor cannot reach. Epic Account Services and Epic Online Services (friends, presence, user info) have no public OpenAPI document and require a registered Epic developer client, so they are not covered.
