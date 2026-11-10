# Logo.dev

Brand lookups for Logo.dev: fetch a brand profile, logo or brandmark as JSON by domain, name, ticker or ID, search brands by name, and manage brand subscriptions and webhook endpoints.

**Interface:** OpenAPI, from Logo.dev's official document at https://www.logo.dev/docs/openapi.json, restricted to the `api.logo.dev` JSON API (`/v2/...`).

**Auth:** API key (secret). Create a secret key (`sk_...`) at https://www.logo.dev/dashboard/api-keys. It is sent as `Authorization: Bearer`. Logo.dev has no OAuth.

**Known gaps:** the image CDN operations (`img.logo.dev`, publishable `pk_` key in a query parameter, image responses) and the private-beta Transaction Enrichment API (`www.logo.dev/api`, separate `tx_beta_` key) are on other hosts and are skipped as `multiple_hosts`. Image URLs can still be built from the `logo_url` fields the JSON API returns.
