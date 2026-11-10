# Addressfinder

Address autocomplete, metadata and verification for Australia and New Zealand, international address autocomplete and metadata, location and NZ point-of-interest lookup, NZ reverse geocoding, and email and phone verification with Addressfinder.

**Interface:** Addressfinder's official OpenAPI document, https://addressfinder.com/au/docs/assets/files/api-370f54b3282fbc9098436cfde8100581.yaml, served from `https://api.addressfinder.io`. This yields 17 tools, all GET requests with no side effects, so none ask for approval. Some lookups are billed by the vendor when they return a result (AU and NZ address metadata, AU address verification, NZ address verification and reverse geocoding, email and phone verification, international metadata); autocomplete suggestions are not billed.

**Auth:** Two methods.
- API key and secret. Create them in the Addressfinder Portal (https://portal.addressfinder.net) under Keys. The secret is sent as the raw `Authorization` header value (no `Bearer` prefix) and the key is filled in as the `key` query parameter of every call, so callers can omit it.
- OAuth 2.0 client credentials (Business and Enterprise plans). Create an OAuth client in the Portal and enter its client id and secret on the connect page. Executor requests tokens from `https://api.addressfinder.io/oauth/token` (scopes `address`, `phone`, `email`) and sends them as `Authorization: Bearer`. The `key` parameter is not sent with this method. There is no redirect URI, as this is a machine grant.

Account health is checked with a one-result AU autocomplete (unbilled) under either method.

**Known gaps:** Key plus registered domain (no secret) is a browser-only mode and is not offered.
