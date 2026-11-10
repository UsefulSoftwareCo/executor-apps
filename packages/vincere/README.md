# Vincere

Vincere recruitment CRM: candidates, contacts, companies, jobs, applications, placements, activities, documents, users and reference data (416 tools, 171 of them writes, each of which asks for approval).

**Interface:** OpenAPI 3.1, Vincere's own API reference at <https://api.vincere.io> (document: <https://api.vincere.io/vapi.yaml>). The API lives on each customer's host, `https://<tenant>.vincere.io/api/v2`; the account's tenant field picks it. The document points at single schema properties (`#/components/schemas/x/properties/y`), which Executor's compiler does not follow, so `patches.json` inlines them. It is generated from the published document by `gen-patches.py` (`python3 gen-patches.py vapi.yaml > patches.json`); rerun it when Vincere publishes a new version.

**Auth:** one `credentials` method. Vincere does not let users register OAuth apps themselves: Vincere support issues the client ID and the API key and registers your callback URL. Every request needs an `x-api-key` header and an `id-token` header, and the id token (valid one hour) comes from the OAuth 2 authorization code flow at `https://id.vincere.io`. Run that flow once (steps in the API reference under "Manual Authentication Process") to get a refresh token, valid ten years. Enter:

- Tenant: the subdomain of your site (`acme` for `acme.vincere.io`).
- API key: from Vincere support.
- Client ID: from Vincere support.
- Refresh token: from the token response of the authorization code flow.

Executor exchanges the refresh token for an id token at `https://id.vincere.io/oauth2/token` and renews it before it expires. A native `oauth2` method is not offered because the API also needs the API key and tenant, which an OAuth account cannot carry.

**Known gaps:** one operation whose 204 response is malformed in the published document is left out. Not verified against a live tenant (no credentials); the refresh request follows the API reference.
