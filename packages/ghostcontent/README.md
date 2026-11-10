# Ghost (Content API)

Read-only access to a Ghost site's public content: published posts, pages, authors, tags, membership tiers and site settings (14 query tools, no mutations).

Interface: hand-written tools over Ghost's official Content API (https://ghost.org/docs/content-api/), because Ghost publishes no OpenAPI document for it. Requests go to `https://<site domain>/ghost/api/content/` with the key sent as the `key` query parameter. The admin-side Admin API (writes) is a different product and is not included.

Auth: Content API key. In Ghost Admin open Settings > Integrations, add a custom integration, and copy the Content API key. When connecting, enter the site domain (a `*.ghost.io` address or your custom domain, for example `mysite.ghost.io`) and the key. Because every site has its own domain, the provider declares no fixed `hosts`, so the key is not handle-protected; requests are only ever built for the domain you entered, over https.

Known gaps: no `Accept-Version` header is sent (the site's current API version is used). The icon is Ghost's mark from Simple Icons.
