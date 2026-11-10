# HTML/CSS to Image

Renders HTML/CSS, public URLs (screenshots) and saved templates to PNG, JPG, WebP or PDF with [HTML/CSS to Image](https://htmlcsstoimage.com) (hcti.io), and manages templates, proxies, storage destinations, Open Graph image configs and usage.

## Interface

HTML/CSS to Image's official remote MCP server, `https://mcp.hcti.io` (Streamable HTTP), documented at https://docs.htmlcsstoimage.com/integrations/mcp/. Tools include `create_image`, `create_url_image`, `create_templated_image`, `create_batch_images`, template create/update/list/versions, `check_usage` and the management tools. The vendor publishes no OpenAPI document, so the REST API (`https://hcti.io/v1`) is not mounted. Tool availability depends on the OAuth scopes granted. Tools that are not read-only ask for approval.

## Auth

OAuth 2.0 only. The server advertises dynamic client registration and PKCE through `https://htmlcsstoimage.com`, so no OAuth app needs to be created by hand. Executor registers its own callback as the redirect URI during that registration, so there is nothing for you to allow-list; connect, then choose the organization and permissions in the browser sign-in page (extra management access is under "More Permissions"). The package requests all published scopes (images, templates, proxies, storage destinations, OG configs, usage); trim the scope list in `index.ts` for a narrower grant.

## Known gaps

- The REST API (`https://hcti.io/v1`, HTTP Basic with an API ID and API Key from https://htmlcsstoimage.com/dashboard/api-keys) is deliberately not mounted. This is a package choice, not a platform limit: the vendor publishes no OpenAPI document and its REST render surface is only a few endpoints (`POST /v1/image`, `POST /v1/image/{template_id}`) that the MCP tools (`create_image`, `create_templated_image`) already cover.
- API key management is REST-only per the vendor and so is unavailable.
- The vendor's docs do not state a total tool count; the tool list depends on the granted scopes.
