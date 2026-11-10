# WildApricot

Association management for WildApricot accounts: contacts, membership levels and applications, events and registrations, invoices, payments, donations, email, stores and the rest of the Admin API.

**Interface:** OpenAPI. WildApricot publishes its Admin API as a Swagger 2.0 definition (version 7.24.0, base `https://api.wildapricot.org/v2.2`) on SwaggerHub, owned by the vendor: <https://api.swaggerhub.com/apis/WildApricot/wild-apricot_public_api/7.24.0>. Most operations take an `accountId`; call the accounts list first.

**Auth:** one method, an API key used as an OAuth 2.0 client-credentials grant against `https://oauth.wildapricot.org/auth/token` with scope `auto`. Create an API key in the WildApricot admin site under its authorized-applications settings (see the vendor help article "Authorizing external applications"). On the connect page enter the client ID `APIKEY` (literally) and the key as the client secret. The key acts with the permissions of the administrator who created it.

**Known gaps:**
- The authorization-code and password flows are not offered: the authorization URL is per organization (`https://<your-org>.wildapricot.com/sys/login/OAuthLogin`), which a fixed provider cannot declare.
- The separate non-administrative member API (`api.wildapricot.org/ui/swagger/publicAccess`) is not mounted.
- WildApricot throttles API requests per account; heavy callers may receive HTTP 429 and should back off. The exact limits are not documented here.
