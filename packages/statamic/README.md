# Statamic

Read-only access to a self-hosted Statamic site's content through its built-in REST API: collections and entries (and collection trees), navigations, taxonomies and terms, asset containers and assets, global sets, forms, users, sites and a ping check (24 query tools, no mutations).

Interface: hand-written tools over Statamic's official REST API (https://statamic.dev/rest-api), because Statamic publishes no OpenAPI document and every site is its own installation. Requests go to `https://<your domain>/api/...` with `Authorization: Bearer <token>`.

Auth: API token. Enable the API in the site's `.env` with `STATAMIC_API_ENABLED=true`, turn on the resources you want in `config/statamic/api.php`, and set `STATAMIC_API_AUTH_TOKEN` to a long random string. When connecting, enter the site domain (for example `mysite.example.com`) and that token. Because every site has its own domain, the provider declares no fixed `hosts`, so the token is not handle-protected; requests are only built for the domain you entered, over https.

Known gaps: a custom API route prefix (`STATAMIC_API_ROUTE`) is not supported, only the default `/api`. A token is required even though Statamic's API is public by default. Filtering (`filter` input, passed as `field:condition=value`) only works where the site enables `allowed_filters`. Sanctum per-user auth is not supported. The icon is Statamic's mark from Simple Icons.
