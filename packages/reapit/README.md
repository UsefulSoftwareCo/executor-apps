# Reapit

Reapit Foundations (Agency Cloud) for estate agents: properties, contacts, companies, applicants, vendors, landlords, tenancies, appointments, offers, enquiries, tasks, works orders, journal entries, keys, documents, identity checks, offices, negotiators, areas, sources, metadata, transactions and the rest of the Platform API (338 tools, 126 of them mutations, each needing approval).

**Interface:** OpenAPI. Reapit's official Swagger 2.0 document is served without authentication at <https://platform.reapit.cloud/docs> (host `platform.reapit.cloud`, no basePath). The framework upgrades Swagger 2.0 itself, so `openapi.ts` points straight at that URL. Every operation uses the document's `Authorization` apiKey header, filled with `Bearer <token>`. Every platform request also gets the `api-version: 2020-01-31` header, and client-credentials requests get the `reapit-customer` header; both are added in `index.ts`. PATCH operations need the resource's current eTag in `If-Match` (take it from a GET).

**Auth**
- Client credentials (machine to machine): in the Reapit Developer Portal create an app of type "Integration", copy its client ID and client secret, and enter them with the customer ID of the agency (`SBOX` for the sandbox). The package exchanges them with Basic auth at `https://connect.reapit.cloud/token` and caches the token until shortly before it expires.
- OAuth (authorization code via Reapit Connect): create an app in the Developer Portal with the auth code flow and register the Executor redirect URI as its redirect URI. Resource scopes (for example `agencyCloud/properties.read`) are set on the app in the Developer Portal; the request itself asks for `openid` and `offline_access`. The framework's `oauth2` declaration has no switch to disable PKCE, so that setting is not expressed here.

Health check calls `GET /offices?pageSize=1`.

**Known gaps:** tools fail with HTTP 403 when the app lacks the matching scope. The OAuth token is bound to the signed-in customer, so no `reapit-customer` header is sent for it.
